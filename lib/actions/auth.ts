'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function login(formData: FormData): Promise<{ error?: string; redirectTo?: string }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Get user profile to determine redirect
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Authentication failed' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.is_super_admin) {
    return { redirectTo: '/super-admin' }
  }

  // Check if user has any memberships
  const { data: memberships } = await supabase
    .from('memberships')
    .select('organization_id, role')
    .eq('user_id', user.id)
    .limit(1)

  if (memberships && memberships.length > 0) {
    const membership = memberships[0]
    if (membership.role === 'admin') {
      return { redirectTo: '/admin' }
    } else {
      return { redirectTo: '/workspace' }
    }
  }

  // No memberships - redirect to workspace (they'll see onboarding)
  return { redirectTo: '/workspace' }
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const token = formData.get('token') as string

  // Verify invitation token
  const { data: invitation, error: inviteError } = await supabase
    .from('invitations')
    .select('*, organization:organizations(*)')
    .eq('token', token)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (inviteError || !invitation) {
    return { error: 'Invalid or expired invitation' }
  }

  // Check if email matches invitation
  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return { error: 'Email does not match invitation' }
  }

  // Sign up the user
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: {
        full_name: fullName,
      },
    },
  })

  if (signUpError) {
    return { error: signUpError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user' }
  }

  // Mark invitation as accepted
  await supabase
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invitation.id)

  // Update profile with full name
  await supabase
    .from('profiles')
    .update({ 
      full_name: fullName,
      is_super_admin: invitation.role === 'super_admin'
    })
    .eq('id', authData.user.id)

  // If organization-specific invitation, create membership
  if (invitation.organization_id && invitation.role !== 'super_admin') {
    await supabase.from('memberships').insert({
      user_id: authData.user.id,
      organization_id: invitation.organization_id,
      role: invitation.role as 'admin' | 'worker',
    })
  }

  redirect('/auth/sign-up-success')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function getSession() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserWithContext() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return null

  const { data: memberships } = await supabase
    .from('memberships')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)

  return {
    user: profile,
    memberships: memberships || [],
    currentOrganization: memberships?.[0]?.organization || null,
    role: profile.is_super_admin 
      ? 'super_admin' as const
      : memberships?.[0]?.role || null,
  }
}
