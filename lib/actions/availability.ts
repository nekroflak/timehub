'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// Working-hours window defaults
const DEFAULT_WORK_START_H = 8
const DEFAULT_WORK_END_H = 17

export type SlotStatus = 'free' | 'busy' | 'vacation' | 'off-hours'

export interface HourSlot {
  hour: number          // 0–23
  label: string         // "08:00"
  status: SlotStatus
}

export interface TeamMember {
  userId: string
  fullName: string | null
  email: string
}

export interface AvailabilityResult {
  member: TeamMember
  date: string          // YYYY-MM-DD
  slots: HourSlot[]
  isFullDayAbsent: boolean
  workStartH: number
  workEndH: number
}

// ─── Context helper (viewer auth) ────────────────────────────────────────────

async function getViewerContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('id, organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return { supabase, user, organizationId: membership.organization_id, role: membership.role }
}

// ─── List org members ────────────────────────────────────────────────────────

export async function getOrgTeamMembers(): Promise<TeamMember[]> {
  const ctx = await getViewerContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('organization_members')
    .select('user_id, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)
    .neq('user_id', ctx.user.id)
    .order('user_id')

  return (data ?? []).map((m: any) => ({
    userId: m.user_id,
    fullName: m.profile?.full_name ?? null,
    email: m.profile?.email ?? '',
  }))
}

// ─── Core: build availability for one member on one date ─────────────────────

export async function getTeamAvailability(
  targetUserId: string,
  date: string           // YYYY-MM-DD
): Promise<AvailabilityResult | null> {
  const ctx = await getViewerContext()
  if (!ctx) return null

  console.log('[v0] availability — viewer:', ctx.user.id)
  console.log('[v0] availability — targetUserId:', targetUserId)
  console.log('[v0] availability — date:', date)

  // Security: verify target belongs to the SAME organization using the viewer's auth client
  const { data: targetMembership } = await ctx.supabase
    .from('organization_members')
    .select('user_id, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)
    .eq('user_id', targetUserId)
    .single()

  if (!targetMembership) {
    console.log('[v0] availability — DENIED: target not in same org')
    return null
  }

  const member: TeamMember = {
    userId: targetUserId,
    fullName: (targetMembership.profile as any)?.full_name ?? null,
    email: (targetMembership.profile as any)?.email ?? '',
  }

  // Use service client for reading target user's data that is protected by RLS
  // (RLS policies only allow users to read their own rows)
  const svc = createServiceClient()

  // Fetch data sources in parallel using service client for cross-user reads
  const [configResult, timeEntryResult, leaveResult, calendarTokenResult] = await Promise.all([
    // user_config — may or may not have RLS, use svc to be safe
    svc
      .from('user_config')
      .select('hours_per_day')
      .eq('user_id', targetUserId)
      .maybeSingle(),

    // time_entries — check for vacation entries on this date
    svc
      .from('time_entries')
      .select('type, start_time, end_time, hours')
      .eq('user_id', targetUserId)
      .eq('organization_id', ctx.organizationId)
      .eq('date', date)
      .maybeSingle(),

    // leave_requests — approved leaves spanning this date
    svc
      .from('leave_requests')
      .select('type, date_from, date_to')
      .eq('user_id', targetUserId)
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'approved')
      .lte('date_from', date)
      .gte('date_to', date),

    // user_calendar_tokens — RLS blocks viewer from seeing another user's tokens,
    // so we MUST use the service client here
    svc
      .from('user_calendar_tokens')
      .select('provider, access_token, refresh_token, expires_at')
      .eq('user_id', targetUserId)
      .order('provider'),
  ])

  const hoursPerDay = configResult.data?.hours_per_day ?? 8
  const workStartH = DEFAULT_WORK_START_H
  const workEndH = Math.min(24, workStartH + hoursPerDay)

  const hasVacationEntry = timeEntryResult.data?.type === 'vacation'
  const hasApprovedLeave = (leaveResult.data ?? []).length > 0
  const isFullDayAbsent = hasVacationEntry || hasApprovedLeave

  const calendarTokens = calendarTokenResult.data ?? []
  console.log('[v0] availability — calendar providers found:', calendarTokens.map((t: any) => t.provider))
  console.log('[v0] availability — isFullDayAbsent:', isFullDayAbsent, '(vacation entry:', hasVacationEntry, ', approved leave:', hasApprovedLeave, ')')

  // Build busy hour-blocks from target's calendar tokens (no event details exposed)
  const busyHours = new Set<number>()

  if (!isFullDayAbsent && calendarTokens.length > 0) {
    for (const token of calendarTokens) {
      const freshToken = await getFreshToken(svc, targetUserId, token)
      if (!freshToken) {
        console.log('[v0] availability — could not get fresh token for provider:', token.provider)
        continue
      }

      const busyBlocks = token.provider === 'google'
        ? await fetchGoogleBusyBlocks(freshToken, date)
        : await fetchOutlookBusyBlocks(freshToken, date)

      console.log('[v0] availability — busy blocks from', token.provider, ':', busyBlocks.length, busyBlocks)

      for (const { startH, endH } of busyBlocks) {
        for (let h = startH; h < endH; h++) busyHours.add(h)
      }
    }
  }

  console.log('[v0] availability — busyHours set:', [...busyHours].sort((a, b) => a - b))

  // Build hourly slots for visible range (06:00–20:00)
  const slots: HourSlot[] = []
  for (let h = 6; h <= 20; h++) {
    let status: SlotStatus

    if (isFullDayAbsent) {
      status = 'vacation'
    } else if (h < workStartH || h >= workEndH) {
      status = 'off-hours'
    } else if (busyHours.has(h)) {
      status = 'busy'
    } else {
      status = 'free'
    }

    slots.push({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      status,
    })
  }

  return { member, date, slots, isFullDayAbsent, workStartH, workEndH }
}

// ─── Token refresh helpers (service client, writes back refreshed token) ─────

async function getFreshToken(
  svc: ReturnType<typeof createServiceClient>,
  userId: string,
  token: { provider: string; access_token: string; refresh_token: string | null; expires_at: string | null }
): Promise<string | null> {
  const isExpired = token.expires_at
    ? new Date(token.expires_at) <= new Date(Date.now() + 60_000)
    : false

  if (!isExpired) return token.access_token
  if (!token.refresh_token) return null

  try {
    let newAccessToken: string | null = null
    let expiresAt: string | null = null

    if (token.provider === 'google') {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      newAccessToken = data.access_token
      expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
    } else {
      const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
          refresh_token: token.refresh_token,
          grant_type: 'refresh_token',
          scope: 'Calendars.Read offline_access',
        }),
      })
      if (!res.ok) return null
      const data = await res.json()
      newAccessToken = data.access_token
      expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null
    }

    if (newAccessToken) {
      await svc
        .from('user_calendar_tokens')
        .update({ access_token: newAccessToken, expires_at: expiresAt, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('provider', token.provider)
    }

    return newAccessToken
  } catch {
    return null
  }
}

// ─── Calendar busy-block fetchers (privacy-safe: return only time ranges) ────

interface BusyBlock { startH: number; endH: number }

async function fetchGoogleBusyBlocks(accessToken: string, date: string): Promise<BusyBlock[]> {
  try {
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeMin: startOfDay,
        timeMax: endOfDay,
        items: [{ id: 'primary' }],
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.log('[v0] availability — Google FreeBusy error:', res.status, await res.text())
      return []
    }
    const data = await res.json()
    const busy: Array<{ start: string; end: string }> = data.calendars?.primary?.busy ?? []

    return busy.map(b => ({
      startH: new Date(b.start).getUTCHours(),
      endH: new Date(b.end).getUTCHours() + (new Date(b.end).getUTCMinutes() > 0 ? 1 : 0),
    }))
  } catch (e) {
    console.log('[v0] availability — Google FreeBusy exception:', e)
    return []
  }
}

async function fetchOutlookBusyBlocks(accessToken: string, date: string): Promise<BusyBlock[]> {
  try {
    const startOfDay = `${date}T00:00:00Z`
    const endOfDay = `${date}T23:59:59Z`

    const res = await fetch('https://graph.microsoft.com/v1.0/me/calendar/getSchedule', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        schedules: ['me'],
        startTime: { dateTime: startOfDay, timeZone: 'UTC' },
        endTime: { dateTime: endOfDay, timeZone: 'UTC' },
        availabilityViewInterval: 60,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      console.log('[v0] availability — Outlook getSchedule error:', res.status, await res.text())
      return []
    }
    const data = await res.json()
    const scheduleItems: Array<{ scheduleItems?: Array<{ start: { dateTime: string }; end: { dateTime: string } }> }>
      = data.value ?? []

    const blocks: BusyBlock[] = []
    for (const schedule of scheduleItems) {
      for (const item of schedule.scheduleItems ?? []) {
        blocks.push({
          startH: new Date(item.start.dateTime).getUTCHours(),
          endH: new Date(item.end.dateTime).getUTCHours() + (new Date(item.end.dateTime).getUTCMinutes() > 0 ? 1 : 0),
        })
      }
    }
    return blocks
  } catch (e) {
    console.log('[v0] availability — Outlook getSchedule exception:', e)
    return []
  }
}
