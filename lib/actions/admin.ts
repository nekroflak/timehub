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
    .from('memberships')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!membership) return null

  return {
    user,
    membership,
    organizationId: membership.organization_id,
  }
}

export async function getTeamMembers() {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const supabase = await createClient()
  
  const { data } = await supabase
    .from('memberships')
    .select('*, profile:profiles(*)')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: true })

  return data || []
}

export async function inviteTeamMember(formData: FormData) {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()
  
  const email = formData.get('email') as string
  const role = formData.get('role') as 'admin' | 'worker'

  // Check if user already exists in org
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('id')
      .eq('user_id', existingProfile.id)
      .eq('organization_id', ctx.organizationId)
      .single()

    if (existingMembership) {
      return { error: 'User is already a member of this organization' }
    }
  }

  // Check for pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .eq('organization_id', ctx.organizationId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    return { error: 'A pending invitation already exists for this email' }
  }

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error } = await supabase
    .from('invitations')
    .insert({
      email,
      role,
      organization_id: ctx.organizationId,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: ctx.user.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team', 'page')
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return { 
    success: true, 
    inviteLink: `${baseUrl}/auth/sign-up?token=${token}` 
  }
}

export async function removeMember(memberId: string) {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()

  // Don't allow removing yourself
  const { data: targetMembership } = await supabase
    .from('memberships')
    .select('user_id')
    .eq('id', memberId)
    .single()

  if (targetMembership?.user_id === ctx.user.id) {
    return { error: 'You cannot remove yourself from the organization' }
  }

  const { error } = await supabase
    .from('memberships')
    .delete()
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team', 'page')
  return { success: true }
}

export async function updateMemberRole(memberId: string, newRole: 'admin' | 'worker') {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('memberships')
    .update({ role: newRole })
    .eq('id', memberId)
    .eq('organization_id', ctx.organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team', 'page')
  return { success: true }
}

export async function getOrgInvitations() {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const supabase = await createClient()
  
  const { data } = await supabase
    .from('invitations')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  return data || []
}

export async function revokeOrgInvitation(invitationId: string) {
  const ctx = await getAdminContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)
    .eq('organization_id', ctx.organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/team', 'page')
  return { success: true }
}

export async function getOrgTimeEntries(startDate?: string, endDate?: string) {
  const ctx = await getAdminContext()
  if (!ctx) return []

  const supabase = await createClient()
  
  let query = supabase
    .from('time_entries')
    .select('*, profile:profiles(full_name, email)')
    .eq('organization_id', ctx.organizationId)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data } = await query

  return data || []
}

export async function getAdminStats() {
  const ctx = await getAdminContext()
  if (!ctx) return null

  const supabase = await createClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const [membersResult, hoursResult, pendingInvitesResult] = await Promise.all([
    supabase
      .from('memberships')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId),
    supabase
      .from('time_entries')
      .select('hours')
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfWeek.toISOString().split('T')[0]),
    supabase
      .from('invitations')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .is('accepted_at', null)
      .gt('expires_at', new Date().toISOString()),
  ])

  const totalHours = hoursResult.data?.reduce((sum, entry) => sum + (entry.hours || 0), 0) || 0

  return {
    totalMembers: membersResult.count || 0,
    hoursThisWeek: totalHours,
    pendingInvitations: pendingInvitesResult.count || 0,
    organizationName: ctx.membership.organization?.name || 'Organization',
  }
}
