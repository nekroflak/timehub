'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createOrganization(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const slug = generateSlug(name)

  // Check if slug exists
  const { data: existing } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) {
    return { error: 'An organization with this name already exists' }
  }

  const { error } = await supabase
    .from('organizations')
    .insert({ name, slug })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/super-admin/organizations', 'page')
  return { success: true }
}

export async function deleteOrganization(organizationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/super-admin/organizations', 'page')
  return { success: true }
}

export async function createInvitation(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    return { error: 'Unauthorized' }
  }

  const email = formData.get('email') as string
  const role = formData.get('role') as string
  const organizationId = formData.get('organizationId') as string | null

  // Check if user already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single()

  if (existingProfile) {
    return { error: 'A user with this email already exists' }
  }

  // Check for pending invitation
  const { data: existingInvite } = await supabase
    .from('invitations')
    .select('id')
    .eq('email', email)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (existingInvite) {
    return { error: 'A pending invitation already exists for this email' }
  }

  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

  const { error } = await supabase
    .from('invitations')
    .insert({
      email,
      role,
      organization_id: organizationId || null,
      token,
      expires_at: expiresAt.toISOString(),
      invited_by: user.id,
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/super-admin/invitations', 'page')
  
  // Return the invite link
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return { 
    success: true, 
    inviteLink: `${baseUrl}/auth/sign-up?token=${token}` 
  }
}

export async function revokeInvitation(invitationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('invitations')
    .delete()
    .eq('id', invitationId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/super-admin/invitations', 'page')
  return { success: true }
}

export async function getOrganizations() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('organizations')
    .select('*, memberships:memberships(count)')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getInvitations() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('invitations')
    .select('*, organization:organizations(name)')
    .order('created_at', { ascending: false })

  if (error) return []
  return data
}

export async function getSuperAdminStats() {
  const supabase = await createClient()

  const [orgsResult, usersResult, invitesResult] = await Promise.all([
    supabase.from('organizations').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('invitations').select('id', { count: 'exact', head: true }).is('accepted_at', null),
  ])

  return {
    totalOrganizations: orgsResult.count || 0,
    totalUsers: usersResult.count || 0,
    pendingInvitations: invitesResult.count || 0,
  }
}
