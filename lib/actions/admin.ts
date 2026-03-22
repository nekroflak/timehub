'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

async function getAdminContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!membership) return null

  return { supabase, user, membership, organizationId: membership.organization_id }
}

export async function getAdminStats() {
  const ctx = await getAdminContext()
  if (!ctx) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [membersResult, hoursResult, pendingInvitesResult] = await Promise.all([
    ctx.supabase
      .from('organization_members')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId),
    ctx.supabase
      .from('time_entries')
      .select('hours')
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
    ctx.supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'pending'),
  ])

  const totalHours = hoursResult.data?.reduce((sum, e) => sum + (e.hours || 0), 0) || 0

  return {
    totalMembers: membersResult.count || 0,
    hoursThisMonth: totalHours,
    pendingInvitations: pendingInvitesResult.count || 0,
    organizationName: (ctx.membership.organization as any)?.name || 'Organization',
  }
}

export async function getTeamMembers() {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('organization_members')
    .select('*, profile:profiles(*)')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: true })

  return data || []
}

export async function inviteTeamMember(formData: FormData): Promise<{ error?: string; success?: boolean; inviteLink?: string }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const email = formData.get('email') as string
  const role = formData.get('role') as 'admin' | 'worker'

  if (!email?.trim()) return { error: 'Email is required' }

  // Check if already a member
  const { data: existingProfile } = await ctx.supabase
    .from('profiles')
    .select('id')
    .eq('email', email.toLowerCase())
    .single()

  if (existingProfile) {
    const { data: existingMember } = await ctx.supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', existingProfile.id)
      .eq('organization_id', ctx.organizationId)
      .single()

    if (existingMember) return { error: 'User is already a member of this organization' }
  }

  // Check for pending invite
  const { data: existingInvite } = await ctx.supabase
    .from('invitations')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('organization_id', ctx.organizationId)
    .eq('status', 'pending')
    .single()

  if (existingInvite) return { error: 'A pending invitation already exists for this email' }

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await ctx.supabase
    .from('invitations')
    .insert({
      email: email.toLowerCase(),
      role,
      organization_id: ctx.organizationId,
      invited_by: ctx.user.id,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })

  if (error) return { error: error.message }

  revalidatePath('/admin/team')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return { success: true, inviteLink: `${baseUrl}/auth/sign-up?token=${token}` }
}

export async function removeMember(memberId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { data: target } = await ctx.supabase
    .from('organization_members')
    .select('user_id')
    .eq('id', memberId)
    .single()

  if (target?.user_id === ctx.user.id) return { error: 'You cannot remove yourself' }

  const { error } = await ctx.supabase
    .from('organization_members')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function updateMemberRole(memberId: string, newRole: OrgRole): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('organization_members')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function getOrgInvitations() {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function revokeOrgInvitation(invitationId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}

export async function getAdminAlerts() {
  const ctx = await getAdminContext()
  if (!ctx) return null

  const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const [submissionsResult, overdueTasksResult, pendingInvitesResult, pendingLeaveResult] = await Promise.all([
    ctx.supabase
      .from('timesheet_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'submitted')
      .eq('year', currentYear)
      .eq('month', currentMonth),
    ctx.supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'assigned')
      .lte('assigned_at', overdueThreshold),
    ctx.supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'pending'),
    ctx.supabase
      .from('leave_requests')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('status', 'pending'),
  ])

  return {
    pendingApprovals: submissionsResult.count || 0,
    overdueTasksCount: overdueTasksResult.count || 0,
    pendingInvitations: pendingInvitesResult.count || 0,
    pendingLeaveRequests: pendingLeaveResult.count || 0,
  }
}

export async function getOrgTimeEntries(startDate?: string, endDate?: string) {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const now = new Date()
  const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const defaultEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  let query = ctx.supabase
    .from('time_entries')
    .select('*, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)
    .gte('date', startDate || defaultStart)
    .lte('date', endDate || defaultEnd)
    .order('date', { ascending: false })

  const { data } = await query
  return data || []
}

type OrgRole = 'admin' | 'worker'
