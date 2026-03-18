'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { TimesheetSubmission } from '@/lib/types'

async function getAdminContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!membership) return null

  return { supabase, user, organizationId: membership.organization_id }
}

export async function getOrgSubmissions(opts?: {
  month?: string
  userId?: string
  status?: string
}): Promise<TimesheetSubmission[]> {
  const ctx = await getAdminContext()
  if (!ctx) {
    console.log('[v0] getOrgSubmissions: no admin context, returning []')
    return []
  }

  console.log('[v0] getOrgSubmissions: organizationId =', ctx.organizationId)
  console.log('[v0] getOrgSubmissions: opts =', JSON.stringify(opts))

  // Step 1: fetch raw submissions WITHOUT profile join to avoid RLS-related row drops
  let query = ctx.supabase
    .from('timesheet_submissions')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })
    .order('submitted_at', { ascending: false })

  if (opts?.month) {
    const [year, month] = opts.month.split('-').map(Number)
    query = query.eq('year', year).eq('month', month)
  }
  if (opts?.userId) {
    query = query.eq('user_id', opts.userId)
  }
  if (opts?.status && opts.status !== 'all') {
    query = query.eq('status', opts.status)
  }

  const { data: rawSubmissions, error } = await query

  console.log('[v0] getOrgSubmissions: rawSubmissions count =', rawSubmissions?.length ?? 0)
  if (error) console.log('[v0] getOrgSubmissions: query error =', error.message)

  if (!rawSubmissions || rawSubmissions.length === 0) return []

  // Step 2: fetch profiles separately for the unique user_ids found
  const userIds = [...new Set(rawSubmissions.map(s => s.user_id))]

  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  console.log('[v0] getOrgSubmissions: profiles fetched =', profiles?.length ?? 0)

  // Step 3: merge profiles into submissions
  const profileMap = new Map((profiles || []).map(p => [p.id, { full_name: p.full_name, email: p.email }]))

  const merged = rawSubmissions.map(sub => ({
    ...sub,
    profile: profileMap.get(sub.user_id) ?? null,
  }))

  console.log('[v0] getOrgSubmissions: final merged count =', merged.length)
  return merged as TimesheetSubmission[]
}

export async function approveSubmission(submissionId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { data: submission } = await ctx.supabase
    .from('timesheet_submissions')
    .select('id, organization_id')
    .eq('id', submissionId)
    .eq('organization_id', ctx.organizationId)
    .single()

  if (!submission) return { error: 'Nie znaleziono arkusza' }

  const { error } = await ctx.supabase
    .from('timesheet_submissions')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function rejectSubmission(
  submissionId: string,
  comment: string
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { data: submission } = await ctx.supabase
    .from('timesheet_submissions')
    .select('id, organization_id')
    .eq('id', submissionId)
    .eq('organization_id', ctx.organizationId)
    .single()

  if (!submission) return { error: 'Nie znaleziono arkusza' }

  const { error } = await ctx.supabase
    .from('timesheet_submissions')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: ctx.user.id,
      comment: comment || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', submissionId)

  if (error) return { error: error.message }

  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function getOrgMembers() {
  const ctx = await getAdminContext()
  if (!ctx) return []

  // Same pattern: fetch members then profiles separately
  const { data: members } = await ctx.supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', ctx.organizationId)

  if (!members || members.length === 0) return []

  const userIds = members.map(m => m.user_id)

  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, { full_name: p.full_name, email: p.email }]))

  return members.map(m => ({
    user_id: m.user_id,
    profile: profileMap.get(m.user_id) ?? null,
  })) as { user_id: string; profile: { full_name: string | null; email: string } | null }[]
}
