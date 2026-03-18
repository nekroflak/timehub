'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getWorkerContext() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return { supabase, user, membership, organizationId: membership.organization_id }
}

export async function getWorkerStats() {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const [monthHoursResult, notesResult] = await Promise.all([
    ctx.supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfMonth),
    ctx.supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId),
  ])

  const monthHours = monthHoursResult.data?.reduce((sum, e) => sum + (e.hours || 0), 0) || 0

  return {
    hoursThisMonth: monthHours,
    totalNotes: notesResult.count || 0,
    organizationName: (ctx.membership.organization as any)?.name || 'Organization',
  }
}

export async function getMyTimeEntries(month?: string) {
  const ctx = await getWorkerContext()
  if (!ctx) return []

  const now = new Date()
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, monthNum] = targetMonth.split('-').map(Number)

  const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]

  const { data } = await ctx.supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  return data || []
}

export async function createTimeEntry(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const date = formData.get('date') as string
  const hours = parseFloat(formData.get('hours') as string)
  const type = (formData.get('type') as string) || 'work'
  const description = formData.get('description') as string

  if (isNaN(hours) || hours <= 0 || hours > 24) return { error: 'Hours must be between 0 and 24' }

  // Check if entry exists
  const { data: existing } = await ctx.supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('date', date)
    .single()

  if (existing) {
    const { error } = await ctx.supabase
      .from('time_entries')
      .update({ hours, type, description: description || null, updated_at: new Date().toISOString() })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    const { error } = await ctx.supabase
      .from('time_entries')
      .insert({
        user_id: ctx.user.id,
        organization_id: ctx.organizationId,
        date,
        hours,
        type,
        description: description || null,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/workspace/time')
  return { success: true }
}

export async function deleteTimeEntry(entryId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', ctx.user.id)

  if (error) return { error: error.message }

  revalidatePath('/workspace/time')
  return { success: true }
}

// Notes
export async function getMyNotes() {
  const ctx = await getWorkerContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('notes')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .order('updated_at', { ascending: false })

  return data || []
}

export async function createNote(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { error } = await ctx.supabase
    .from('notes')
    .insert({
      user_id: ctx.user.id,
      organization_id: ctx.organizationId,
      title: title || 'Nowa notatka',
      content: content || '',
    })

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes')
  return { success: true }
}

export async function updateNote(noteId: string, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { error } = await ctx.supabase
    .from('notes')
    .update({ title, content, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes')
  return { success: true }
}

export async function deleteNote(noteId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes')
  return { success: true }
}
