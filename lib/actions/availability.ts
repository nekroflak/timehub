'use server'

import { createClient } from '@/lib/supabase/server'

const DEFAULT_WORK_START_H = 8
const DEFAULT_WORK_END_H = 17

export type SlotStatus = 'free' | 'busy' | 'vacation' | 'off-hours'

export interface HourSlot {
  hour: number
  label: string
  status: SlotStatus
}

export interface TeamMember {
  userId: string
  fullName: string | null
  email: string
}

export interface AvailabilityResult {
  member: TeamMember
  date: string
  slots: HourSlot[]
  isFullDayAbsent: boolean
  workStartH: number
  workEndH: number
}

// ─── Viewer context ───────────────────────────────────────────────────────────

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

  return { supabase, user, organizationId: membership.organization_id }
}

// ─── List org members (excluding self) ───────────────────────────────────────

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

// ─── Core: read from team_availability_blocks cache ──────────────────────────

export async function getTeamAvailability(
  targetUserId: string,
  date: string
): Promise<AvailabilityResult | null> {
  const ctx = await getViewerContext()
  if (!ctx) return null

  // Security: verify target is in the same org using the viewer's auth client
  const { data: targetMembership } = await ctx.supabase
    .from('organization_members')
    .select('user_id, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)
    .eq('user_id', targetUserId)
    .single()

  if (!targetMembership) return null

  const member: TeamMember = {
    userId: targetUserId,
    fullName: (targetMembership.profile as any)?.full_name ?? null,
    email: (targetMembership.profile as any)?.email ?? '',
  }

  // Fetch working hours config for the target user.
  // team_availability_blocks SELECT is allowed by the org-members RLS policy,
  // so the viewer's own client can read blocks for any same-org user.
  const [configResult, blocksResult, leaveResult] = await Promise.all([
    // user_config may have no RLS or viewer-only RLS — we only need hoursPerDay,
    // so fall back gracefully to default if the query returns nothing.
    ctx.supabase
      .from('user_config')
      .select('hours_per_day')
      .eq('user_id', targetUserId)
      .maybeSingle(),

    // Cached availability blocks — readable by same-org members via RLS policy
    ctx.supabase
      .from('team_availability_blocks')
      .select('source, status, start_time, end_time')
      .eq('organization_id', ctx.organizationId)
      .eq('user_id', targetUserId)
      .eq('date', date),

    // Approved leave requests spanning this date (fallback/supplement to blocks)
    ctx.supabase
      .from('leave_requests')
      .select('type, date_from, date_to')
      .eq('user_id', targetUserId)
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'approved')
      .lte('date_from', date)
      .gte('date_to', date),
  ])

  const hoursPerDay = configResult.data?.hours_per_day ?? 8
  const workStartH = DEFAULT_WORK_START_H
  const workEndH = Math.min(24, workStartH + hoursPerDay)

  const blocks = blocksResult.data ?? []
  const leaves = leaveResult.data ?? []

  // Determine full-day absence: either an absence block or an approved leave
  const hasAbsenceBlock = blocks.some(b => b.status === 'absence')
  const hasApprovedLeave = leaves.length > 0
  const isFullDayAbsent = hasAbsenceBlock || hasApprovedLeave

  // Build busy-hour set from busy blocks
  const busyHours = new Set<number>()
  if (!isFullDayAbsent) {
    for (const block of blocks) {
      if (block.status !== 'busy') continue
      const startH = parseInt(block.start_time.slice(0, 2), 10)
      const endH = parseInt(block.end_time.slice(0, 2), 10)
      for (let h = startH; h < endH; h++) busyHours.add(h)
    }
  }

  // Build hourly slots for the visible range (06:00–20:00)
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

    slots.push({ hour: h, label: `${String(h).padStart(2, '0')}:00`, status })
  }

  return { member, date, slots, isFullDayAbsent, workStartH, workEndH }
}
