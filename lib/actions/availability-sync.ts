'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilityBlock {
  organization_id: string
  user_id: string
  source: 'google' | 'outlook' | 'leave_request'
  status: 'busy' | 'absence'
  date: string        // YYYY-MM-DD
  start_time: string  // HH:MM:SS
  end_time: string    // HH:MM:SS
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toTimeStr(h: number, m = 0): string {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

function clampHour(h: number): number {
  return Math.max(0, Math.min(23, h))
}

// Iterate working days (Mon–Fri) in a YYYY-MM-DD range, inclusive.
function workingDaysInRange(dateFrom: string, dateTo: string): string[] {
  const days: string[] = []
  const cur = new Date(dateFrom + 'T00:00:00Z')
  const end = new Date(dateTo + 'T00:00:00Z')
  while (cur <= end) {
    const dow = cur.getUTCDay()
    if (dow !== 0 && dow !== 6) {
      days.push(cur.toISOString().slice(0, 10))
    }
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return days
}

// ─── Calendar event → busy block normalizer ───────────────────────────────────

interface RawBusyInterval { start: string; end: string }

function normalizeToBusyBlocks(
  intervals: RawBusyInterval[],
  orgId: string,
  userId: string,
  source: 'google' | 'outlook'
): AvailabilityBlock[] {
  const blocks: AvailabilityBlock[] = []

  for (const { start, end } of intervals) {
    const startDt = new Date(start)
    const endDt = new Date(end)
    const date = startDt.toISOString().slice(0, 10)

    const startH = clampHour(startDt.getUTCHours())
    const endH = clampHour(endDt.getUTCHours() + (endDt.getUTCMinutes() > 0 ? 1 : 0))
    if (startH >= endH) continue

    blocks.push({
      organization_id: orgId,
      user_id: userId,
      source,
      status: 'busy',
      date,
      start_time: toTimeStr(startH),
      end_time: toTimeStr(endH),
    })
  }

  return blocks
}

// ─── Google FreeBusy fetch ────────────────────────────────────────────────────

async function fetchGoogleBusyIntervals(
  accessToken: string,
  daysAhead = 30
): Promise<RawBusyInterval[]> {
  const now = new Date()
  const timeMin = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  const future = new Date(now)
  future.setUTCDate(future.getUTCDate() + daysAhead)
  const timeMax = future.toISOString()

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: 'primary' }] }),
    cache: 'no-store',
  })

  if (!res.ok) return []
  const data = await res.json()
  return data.calendars?.primary?.busy ?? []
}

// ─── Outlook Calendar view fetch ──────────────────────────────────────────────

async function fetchOutlookBusyIntervals(
  accessToken: string,
  daysAhead = 30
): Promise<RawBusyInterval[]> {
  const now = new Date()
  const startDateTime = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
  const future = new Date(now)
  future.setUTCDate(future.getUTCDate() + daysAhead)
  const endDateTime = future.toISOString()

  // Use calendarView — returns events (no titles stored) for the window
  const params = new URLSearchParams({
    startDateTime,
    endDateTime,
    $select: 'start,end',
    $top: '200',
  })

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  )

  if (!res.ok) return []
  const data = await res.json()

  return (data.value ?? []).map((e: { start: { dateTime: string }; end: { dateTime: string } }) => ({
    start: e.start.dateTime,
    end: e.end.dateTime,
  }))
}

// ─── Main sync: calendar (called by the user for themselves) ──────────────────

export async function syncMyCalendarAvailability(
  provider: 'google' | 'outlook'
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()
  if (!membership) return

  const orgId = membership.organization_id

  // Read own token (viewer reads own row — within RLS)
  const { data: tokenRow } = await supabase
    .from('user_calendar_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', user.id)
    .eq('provider', provider)
    .maybeSingle()

  if (!tokenRow) return

  // Refresh if needed
  let accessToken = tokenRow.access_token
  const isExpired = tokenRow.expires_at
    ? new Date(tokenRow.expires_at) <= new Date(Date.now() + 60_000)
    : false

  if (isExpired && tokenRow.refresh_token) {
    const refreshed = await refreshToken(provider, tokenRow.refresh_token)
    if (!refreshed) return
    accessToken = refreshed.access_token
    await supabase
      .from('user_calendar_tokens')
      .update({ access_token: refreshed.access_token, expires_at: refreshed.expiresAt, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('provider', provider)
  }

  // Fetch busy intervals from the external calendar
  const intervals = provider === 'google'
    ? await fetchGoogleBusyIntervals(accessToken)
    : await fetchOutlookBusyIntervals(accessToken)

  const blocks = normalizeToBusyBlocks(intervals, orgId, user.id, provider)

  // Use service client to write — the "manage own" policy uses auth.uid() which
  // is set correctly in the service client context via RLS bypass.
  // Actually since RLS "all" policy checks auth.uid() = user_id and we use service
  // client (bypass RLS), we can write directly.
  const svc = createServiceClient()

  // Delete future blocks for this user+source, then bulk insert fresh ones
  const todayStr = new Date().toISOString().slice(0, 10)
  await svc
    .from('team_availability_blocks')
    .delete()
    .eq('user_id', user.id)
    .eq('source', provider)
    .gte('date', todayStr)

  if (blocks.length > 0) {
    await svc
      .from('team_availability_blocks')
      .insert(blocks.map(b => ({ ...b, updated_at: new Date().toISOString() })))
  }
}

// ─── Sync: leave request approved (called by admin after approval) ─────────────

export async function syncLeaveRequestBlocks(
  userId: string,
  orgId: string,
  dateFrom: string,
  dateTo: string
): Promise<void> {
  const svc = createServiceClient()
  const days = workingDaysInRange(dateFrom, dateTo)
  if (days.length === 0) return

  // Remove existing leave_request blocks for those exact days
  await svc
    .from('team_availability_blocks')
    .delete()
    .eq('user_id', userId)
    .eq('organization_id', orgId)
    .eq('source', 'leave_request')
    .in('date', days)

  const blocks: AvailabilityBlock[] = days.map(date => ({
    organization_id: orgId,
    user_id: userId,
    source: 'leave_request',
    status: 'absence',
    date,
    start_time: '00:00:00',
    end_time: '23:59:00',
  }))

  await svc
    .from('team_availability_blocks')
    .insert(blocks.map(b => ({ ...b, updated_at: new Date().toISOString() })))
}

// ─── Token refresh helper ─────────────────────────────────────────────────────

async function refreshToken(
  provider: 'google' | 'outlook',
  refreshToken: string
): Promise<{ access_token: string; expiresAt: string | null } | null> {
  try {
    const res = provider === 'google'
      ? await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
          }),
        })
      : await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: process.env.MICROSOFT_CLIENT_ID!,
            client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
            scope: 'Calendars.Read offline_access',
          }),
        })

    if (!res.ok) return null
    const data = await res.json()
    return {
      access_token: data.access_token,
      expiresAt: data.expires_in
        ? new Date(Date.now() + data.expires_in * 1000).toISOString()
        : null,
    }
  } catch {
    return null
  }
}
