'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomBytes } from 'crypto'

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function generateToken(): string {
  return randomBytes(32).toString('hex')
}

async function assertSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single()

  if (profile?.platform_role !== 'super_admin') return null
  return { supabase, user }
}

export async function getSuperAdminStats() {
  const ctx = await assertSuperAdmin()
  if (!ctx) return { totalOrganizations: 0, totalUsers: 0, pendingInvitations: 0 }

  const [orgsResult, usersResult, invitesResult] = await Promise.all([
    ctx.supabase.from('organizations').select('id', { count: 'exact', head: true }),
    ctx.supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ctx.supabase.from('invitations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  return {
    totalOrganizations: orgsResult.count || 0,
    totalUsers: usersResult.count || 0,
    pendingInvitations: invitesResult.count || 0,
  }
}

export async function getOrganizations() {
  const ctx = await assertSuperAdmin()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('organizations')
    .select('*, members:organization_members(count)')
    .order('created_at', { ascending: false })

  return data || []
}

export async function createOrganization(formData: FormData): Promise<{ error?: string; success?: boolean; inviteLink?: string }> {
  const ctx = await assertSuperAdmin()
  if (!ctx) return { error: 'Unauthorized' }

  const name = formData.get('name') as string
  const adminEmail = formData.get('adminEmail') as string
  const plan = (formData.get('plan') as string) || 'free'
  const status = (formData.get('status') as string) || 'active'
  const slugInput = formData.get('slug') as string

  if (!name?.trim()) return { error: 'Organization name is required' }
  if (!adminEmail?.trim()) return { error: 'Admin email is required' }

  const slug = slugInput?.trim() ? slugInput.trim() : generateSlug(name)

  // Check slug uniqueness
  const { data: existing } = await ctx.supabase
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existing) return { error: 'A organization with this slug already exists' }

  // Create org
  const { data: org, error: orgError } = await ctx.supabase
    .from('organizations')
    .insert({ name, slug, plan, status, created_by: ctx.user.id })
    .select()
    .single()

  if (orgError || !org) return { error: orgError?.message || 'Failed to create organization' }

  // Create invitation for first admin
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const { error: inviteError } = await ctx.supabase
    .from('invitations')
    .insert({
      organization_id: org.id,
      email: adminEmail.toLowerCase(),
      role: 'admin',
      invited_by: ctx.user.id,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })

  if (inviteError) return { error: inviteError.message }

  revalidatePath('/super-admin/organizations')
  revalidatePath('/super-admin/invitations')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return {
    success: true,
    inviteLink: `${baseUrl}/auth/sign-up?token=${token}`,
  }
}

export async function deleteOrganization(organizationId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await assertSuperAdmin()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('organizations')
    .delete()
    .eq('id', organizationId)

  if (error) return { error: error.message }

  revalidatePath('/super-admin/organizations')
  return { success: true }
}

export async function getInvitations() {
  const ctx = await assertSuperAdmin()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('invitations')
    .select('*, organization:organizations(name)')
    .order('created_at', { ascending: false })

  return data || []
}

export async function createInvitation(formData: FormData): Promise<{ error?: string; success?: boolean; inviteLink?: string }> {
  const ctx = await assertSuperAdmin()
  if (!ctx) return { error: 'Unauthorized' }

  const email = formData.get('email') as string
  const role = formData.get('role') as 'admin' | 'worker'
  const organizationId = formData.get('organizationId') as string

  if (!email?.trim()) return { error: 'Email is required' }
  if (!organizationId) return { error: 'Organization is required' }

  // Check for pending invitation for this email + org
  const { data: existingInvite } = await ctx.supabase
    .from('invitations')
    .select('id')
    .eq('email', email.toLowerCase())
    .eq('organization_id', organizationId)
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
      organization_id: organizationId,
      invited_by: ctx.user.id,
      token,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
    })

  if (error) return { error: error.message }

  revalidatePath('/super-admin/invitations')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return { success: true, inviteLink: `${baseUrl}/auth/sign-up?token=${token}` }
}

export async function revokeInvitation(invitationId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await assertSuperAdmin()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('invitations')
    .update({ status: 'cancelled' })
    .eq('id', invitationId)

  if (error) return { error: error.message }

  revalidatePath('/super-admin/invitations')
  return { success: true }
}

export async function getAllUsers() {
  const ctx = await assertSuperAdmin()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('profiles')
    .select('*, memberships:organization_members(role, organization:organizations(name))')
    .order('created_at', { ascending: false })

  return data || []
}
