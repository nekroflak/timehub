'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

async function getWorkerContext() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('*, organization:organizations(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return {
    user,
    membership,
    organizationId: membership.organization_id,
  }
}

export async function getMyTimeEntries(month?: string) {
  const ctx = await getWorkerContext()
  if (!ctx) return []

  const supabase = await createClient()
  
  // Default to current month
  const now = new Date()
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, monthNum] = targetMonth.split('-').map(Number)
  
  const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]

  const { data } = await supabase
    .from('time_entries')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  return data || []
}

export async function createTimeEntry(formData: FormData) {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()
  
  const date = formData.get('date') as string
  const hours = parseFloat(formData.get('hours') as string)
  const description = formData.get('description') as string

  if (isNaN(hours) || hours <= 0 || hours > 24) {
    return { error: 'Hours must be between 0 and 24' }
  }

  // Check if entry already exists for this date
  const { data: existing } = await supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('date', date)
    .single()

  if (existing) {
    // Update existing entry
    const { error } = await supabase
      .from('time_entries')
      .update({ hours, description: description || null })
      .eq('id', existing.id)

    if (error) return { error: error.message }
  } else {
    // Create new entry
    const { error } = await supabase
      .from('time_entries')
      .insert({
        user_id: ctx.user.id,
        organization_id: ctx.organizationId,
        date,
        hours,
        description: description || null,
      })

    if (error) return { error: error.message }
  }

  revalidatePath('/workspace/time', 'page')
  return { success: true }
}

export async function deleteTimeEntry(entryId: string) {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('time_entries')
    .delete()
    .eq('id', entryId)
    .eq('user_id', ctx.user.id)

  if (error) return { error: error.message }

  revalidatePath('/workspace/time', 'page')
  return { success: true }
}

// Notes
export async function getMyNotes() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('notes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return data || []
}

export async function createNote(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { error } = await supabase
    .from('notes')
    .insert({
      user_id: user.id,
      title,
      content: content || null,
    })

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes', 'page')
  return { success: true }
}

export async function updateNote(noteId: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const content = formData.get('content') as string

  const { error } = await supabase
    .from('notes')
    .update({ title, content: content || null, updated_at: new Date().toISOString() })
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes', 'page')
  return { success: true }
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', noteId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }

  revalidatePath('/workspace/notes', 'page')
  return { success: true }
}

export async function getWorkerStats() {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const supabase = await createClient()

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [weekHoursResult, monthHoursResult, notesResult] = await Promise.all([
    supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfWeek.toISOString().split('T')[0]),
    supabase
      .from('time_entries')
      .select('hours')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfMonth.toISOString().split('T')[0]),
    supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id),
  ])

  const weekHours = weekHoursResult.data?.reduce((sum, e) => sum + (e.hours || 0), 0) || 0
  const monthHours = monthHoursResult.data?.reduce((sum, e) => sum + (e.hours || 0), 0) || 0

  return {
    hoursThisWeek: weekHours,
    hoursThisMonth: monthHours,
    totalNotes: notesResult.count || 0,
    organizationName: ctx.membership.organization?.name || 'Organization',
  }
}
