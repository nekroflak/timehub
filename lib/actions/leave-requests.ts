'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { LeaveRequestType, LeaveRequestStatus } from '@/lib/types'

async function getWorkerContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return { supabase, user, organizationId: membership.organization_id, role: membership.role }
}

async function getAdminContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Accept both 'admin' and 'super_admin' roles for org-level admin access
  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .in('role', ['admin', 'super_admin'])
    .single()

  if (!membership) return null

  console.log('[v0] leave-requests getAdminContext — organizationId:', membership.organization_id, '| role:', membership.role)

  return { supabase, user, organizationId: membership.organization_id }
}

// ----------------------------------------------------------------
// Worker actions
// ----------------------------------------------------------------

export async function getMyLeaveRequests() {
  const ctx = await getWorkerContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('leave_requests')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function createLeaveRequest(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const type = formData.get('type') as LeaveRequestType
  const date_from = formData.get('date_from') as string
  const date_to = formData.get('date_to') as string
  const worker_note = (formData.get('worker_note') as string) || null

  if (!type || !date_from || !date_to) return { error: 'Wypełnij wszystkie wymagane pola' }
  if (date_to < date_from) return { error: 'Data końcowa nie może być wcześniejsza niż data początkowa' }

  const validTypes: LeaveRequestType[] = ['vacation', 'home_office', 'private_leave', 'sick_leave']
  if (!validTypes.includes(type)) return { error: 'Nieprawidłowy typ wniosku' }

  const { error } = await ctx.supabase
    .from('leave_requests')
    .insert({
      organization_id: ctx.organizationId,
      user_id: ctx.user.id,
      type,
      date_from,
      date_to,
      worker_note: worker_note || null,
      status: 'pending',
    })

  if (error) return { error: error.message }

  revalidatePath('/workspace/requests')
  return { success: true }
}

export async function deleteLeaveRequest(requestId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  // Only pending requests can be deleted by the worker
  const { error } = await ctx.supabase
    .from('leave_requests')
    .delete()
    .eq('id', requestId)
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('status', 'pending')

  if (error) return { error: error.message }

  revalidatePath('/workspace/requests')
  return { success: true }
}

// ----------------------------------------------------------------
// Admin actions
// ----------------------------------------------------------------

export async function getOrgLeaveRequests(filters?: {
  status?: LeaveRequestStatus | 'all'
  userId?: string
  type?: LeaveRequestType | 'all'
}) {
  const ctx = await getAdminContext()
  if (!ctx) {
    console.log('[v0] getOrgLeaveRequests — no admin context, returning []')
    return []
  }

  console.log('[v0] getOrgLeaveRequests — querying for organization_id:', ctx.organizationId)
  console.log('[v0] getOrgLeaveRequests — active filters:', JSON.stringify(filters))

  // Step 1: fetch raw rows without any join first so we always get the count
  let rawQuery = ctx.supabase
    .from('leave_requests')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    rawQuery = rawQuery.eq('status', filters.status)
  }
  if (filters?.userId) {
    rawQuery = rawQuery.eq('user_id', filters.userId)
  }
  if (filters?.type && filters.type !== 'all') {
    rawQuery = rawQuery.eq('type', filters.type)
  }

  const { data: rawRows, error: rawError } = await rawQuery

  console.log('[v0] getOrgLeaveRequests — raw rows count:', rawRows?.length ?? 0)
  if (rawError) console.log('[v0] getOrgLeaveRequests — raw query error:', rawError.message)

  if (!rawRows || rawRows.length === 0) return []

  // Step 2: try to enrich with profiles; if join fails, fall back to raw rows
  const userIds = [...new Set(rawRows.map(r => r.user_id))]
  const { data: profiles, error: profileError } = await ctx.supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  if (profileError) {
    console.log('[v0] getOrgLeaveRequests — profile join error:', profileError.message, '— serving raw rows as fallback')
  }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))

  const enriched = rawRows.map(r => ({
    ...r,
    profile: profileMap.get(r.user_id) ?? null,
  }))

  console.log('[v0] getOrgLeaveRequests — enriched rows count:', enriched.length)

  return enriched
}

export async function reviewLeaveRequest(
  requestId: string,
  decision: 'approved' | 'rejected',
  adminComment?: string
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  // Ensure the request belongs to this org
  const { data: existing } = await ctx.supabase
    .from('leave_requests')
    .select('id, user_id')
    .eq('id', requestId)
    .eq('organization_id', ctx.organizationId)
    .single()

  if (!existing) return { error: 'Wniosek nie istnieje' }

  // Admin cannot approve their own request
  if (existing.user_id === ctx.user.id) {
    return { error: 'Nie możesz zatwierdzać własnych wniosków' }
  }

  const { error } = await ctx.supabase
    .from('leave_requests')
    .update({
      status: decision,
      admin_comment: adminComment || null,
      reviewed_by: ctx.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/requests')
  return { success: true }
}

export async function getAdminLeaveAlertCount(): Promise<number> {
  const ctx = await getAdminContext()
  if (!ctx) return 0

  const { count } = await ctx.supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', ctx.organizationId)
    .eq('status', 'pending')

  return count || 0
}

export async function getWorkerRejectedLeaveCount(): Promise<number> {
  const ctx = await getWorkerContext()
  if (!ctx) return 0

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { count } = await ctx.supabase
    .from('leave_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('status', 'rejected')
    .gte('reviewed_at', sevenDaysAgo)

  return count || 0
}
