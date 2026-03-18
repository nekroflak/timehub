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
  if (!ctx) return []

  let query = ctx.supabase
    .from('timesheet_submissions')
    .select('*, profile:profiles(full_name, email)')
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

  const { data } = await query
  return (data || []) as TimesheetSubmission[]
}

export async function approveSubmission(submissionId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  // Verify submission belongs to admin's org
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

  const { data } = await ctx.supabase
    .from('organization_members')
    .select('user_id, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)

  return (data || []) as { user_id: string; profile: { full_name: string | null; email: string } | null }[]
}
