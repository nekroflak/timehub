'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { UserContext } from '@/lib/types'

// Resolve the current user's full context: profile + membership + org
export async function getUserContext(): Promise<UserContext | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Upsert profile in case trigger didn't fire (e.g. existing user)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    // Try to create it
    const { data: newProfile } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email!,
        full_name: user.user_metadata?.full_name || null,
        platform_role: user.email === 'kamilurbanmail@gmail.com' ? 'super_admin' : 'user',
      }, { onConflict: 'id' })
      .select()
      .single()
    
    if (!newProfile) return null

    return {
      profile: newProfile,
      membership: null,
      organization: null,
      isSuperAdmin: newProfile.platform_role === 'super_admin',
      orgRole: null,
    }
  }

  const isSuperAdmin = profile.platform_role === 'super_admin'

  // Get membership (super admin doesn't need one)
  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .single()

  return {
    profile,
    membership: membership || null,
    organization: (membership?.organization as any) || null,
    isSuperAdmin,
    orgRole: membership?.role || null,
  }
}

// Resolve pending invitations for a user and accept them
export async function resolvePendingInvitations(userId: string, email: string) {
  const supabase = await createClient()

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('email', email.toLowerCase())
    .eq('status', 'pending')

  if (!invitations || invitations.length === 0) return

  for (const invitation of invitations) {
    // Check expiry
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
      await supabase
        .from('invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id)
      continue
    }

    // Add to org
    await supabase
      .from('organization_members')
      .upsert({
        organization_id: invitation.organization_id,
        user_id: userId,
        role: invitation.role,
      }, { onConflict: 'organization_id,user_id' })

    // Mark accepted
    await supabase
      .from('invitations')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)
  }
}

export async function login(formData: FormData): Promise<{ error?: string; redirectTo?: string }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed' }

  // Ensure profile exists
  await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email!,
      full_name: user.user_metadata?.full_name || null,
      platform_role: user.email === 'kamilurbanmail@gmail.com' ? 'super_admin' : 'user',
    }, { onConflict: 'id' })

  // Resolve any pending invitations
  await resolvePendingInvitations(user.id, user.email!)

  // Get updated profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single()

  revalidatePath('/', 'layout')

  if (profile?.platform_role === 'super_admin') {
    return { redirectTo: '/super-admin' }
  }

  // Check membership role
  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role === 'admin') return { redirectTo: '/admin' }
  if (membership?.role === 'worker') return { redirectTo: '/workspace' }

  return { redirectTo: '/no-org' }
}

export async function signUp(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const token = formData.get('token') as string

  // Validate invitation token
  const { data: invitation } = await supabase
    .from('invitations')
    .select('*, organization:organizations(name)')
    .eq('token', token)
    .eq('status', 'pending')
    .single()

  if (!invitation) {
    return { error: 'Invalid or expired invitation link' }
  }

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return { error: 'This invitation has expired' }
  }

  if (invitation.email.toLowerCase() !== email.toLowerCase()) {
    return { error: 'Email does not match the invitation' }
  }

  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo:
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
      data: { full_name: fullName },
    },
  })

  if (signUpError) return { error: signUpError.message }
  if (!authData.user) return { error: 'Failed to create account' }

  // Profile is created by trigger; resolve invitation
  await resolvePendingInvitations(authData.user.id, email)

  redirect('/auth/sign-up-success')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}
