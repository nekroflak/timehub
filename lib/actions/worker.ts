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

// Returns working days in a month (Mon–Fri)
function countWorkingDays(year: number, month: number): number {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month, d).getDay()
    if (dow !== 0 && dow !== 6) count++
  }
  return count
}

export async function getUserConfig() {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const { data } = await ctx.supabase
    .from('user_config')
    .select('*')
    .eq('user_id', ctx.user.id)
    .single()

  if (data) return data

  // Return defaults if no config exists
  return {
    hours_per_day: 8,
    hourly_rate: 50,
    overtime_multiplier: 1.5,
    currency: 'PLN',
  }
}

export async function upsertUserConfig(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const hours_per_day = parseFloat(formData.get('hours_per_day') as string) || 8
  const hourly_rate = parseFloat(formData.get('hourly_rate') as string) || 50
  const overtime_multiplier = parseFloat(formData.get('overtime_multiplier') as string) || 1.5
  const currency = (formData.get('currency') as string) || 'PLN'

  const { error } = await ctx.supabase
    .from('user_config')
    .upsert({
      user_id: ctx.user.id,
      organization_id: ctx.organizationId,
      hours_per_day,
      hourly_rate,
      overtime_multiplier,
      currency,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  revalidatePath('/workspace/time')
  return { success: true }
}

export async function getWorkerStats() {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

  const [monthEntriesResult, notesResult, configResult] = await Promise.all([
    ctx.supabase
      .from('time_entries')
      .select('hours, type')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth),
    ctx.supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId),
    ctx.supabase
      .from('user_config')
      .select('hours_per_day')
      .eq('user_id', ctx.user.id)
      .single(),
  ])

  const hoursPerDay = configResult.data?.hours_per_day || 8
  const workingDays = countWorkingDays(now.getFullYear(), now.getMonth())
  const entries = monthEntriesResult.data || []

  const workHours = entries.filter(e => e.type === 'work').reduce((sum, e) => sum + (e.hours || 0), 0)
  const vacationDays = entries.filter(e => e.type === 'vacation').length
  const vacationHours = vacationDays * hoursPerDay
  const expectedHours = Math.max(0, (workingDays - vacationDays) * hoursPerDay)
  const overtimeHours = Math.max(0, workHours - expectedHours)

  return {
    hoursThisMonth: workHours,
    vacationDays,
    overtimeHours,
    expectedHours,
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

export async function getMonthlySummary(month?: string) {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const now = new Date()
  const targetMonth = month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, monthNum] = targetMonth.split('-').map(Number)

  const startDate = new Date(year, monthNum - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, monthNum, 0).toISOString().split('T')[0]

  const [entriesResult, configResult] = await Promise.all([
    ctx.supabase
      .from('time_entries')
      .select('hours, type, date')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .gte('date', startDate)
      .lte('date', endDate),
    ctx.supabase
      .from('user_config')
      .select('*')
      .eq('user_id', ctx.user.id)
      .single(),
  ])

  const config = configResult.data || { hours_per_day: 8, hourly_rate: 50, overtime_multiplier: 1.5, currency: 'PLN' }
  const entries = entriesResult.data || []
  const workingDays = countWorkingDays(year, monthNum - 1)

  const workEntries = entries.filter(e => e.type === 'work')
  const vacationEntries = entries.filter(e => e.type === 'vacation')

  const workHours = workEntries.reduce((sum, e) => sum + (e.hours || 0), 0)
  const vacationDays = vacationEntries.length
  const effectiveWorkingDays = Math.max(0, workingDays - vacationDays)
  const expectedHours = effectiveWorkingDays * config.hours_per_day
  const overtimeHours = Math.max(0, workHours - expectedHours)
  const undertimeHours = Math.max(0, expectedHours - workHours)
  const overtimePay = overtimeHours * config.hourly_rate * config.overtime_multiplier
  const regularPay = Math.min(workHours, expectedHours) * config.hourly_rate

  return {
    workingDays,
    vacationDays,
    effectiveWorkingDays,
    expectedHours,
    workHours,
    overtimeHours,
    undertimeHours,
    overtimePay,
    regularPay,
    totalPay: regularPay + overtimePay,
    currency: config.currency,
    hoursPerDay: config.hours_per_day,
  }
}

export async function createTimeEntry(formData: FormData): Promise<{ error?: string; success?: boolean; hours?: number }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const date = formData.get('date') as string
  const type = (formData.get('type') as string) || 'work'
  const description = formData.get('description') as string
  const start_time = (formData.get('start_time') as string) || null
  const end_time = (formData.get('end_time') as string) || null

  let hours: number

  if (type === 'vacation') {
    const { data: config } = await ctx.supabase
      .from('user_config')
      .select('hours_per_day')
      .eq('user_id', ctx.user.id)
      .single()
    hours = config?.hours_per_day || 8
  } else if (start_time && end_time) {
    // Calculate hours from start/end time
    const [sh, sm] = start_time.split(':').map(Number)
    const [eh, em] = end_time.split(':').map(Number)
    const startMins = sh * 60 + sm
    const endMins = eh * 60 + em
    if (endMins <= startMins) return { error: 'Czas zakończenia musi być późniejszy niż czas rozpoczęcia' }
    hours = Math.round((endMins - startMins) / 60 * 10) / 10
    if (hours <= 0 || hours > 24) return { error: 'Nieprawidłowy zakres czasu' }
  } else {
    hours = parseFloat(formData.get('hours') as string)
    if (isNaN(hours) || hours <= 0 || hours > 24) return { error: 'Godziny muszą być między 0 a 24' }
  }

  const { data: existing } = await ctx.supabase
    .from('time_entries')
    .select('id')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('date', date)
    .single()

  const payload = {
    hours,
    type,
    description: description || null,
    start_time: type === 'vacation' ? null : (start_time || null),
    end_time: type === 'vacation' ? null : (end_time || null),
    updated_at: new Date().toISOString(),
  }

  if (existing) {
    const { error } = await ctx.supabase
      .from('time_entries')
      .update(payload)
      .eq('id', existing.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await ctx.supabase
      .from('time_entries')
      .insert({
        user_id: ctx.user.id,
        organization_id: ctx.organizationId,
        date,
        ...payload,
      })
    if (error) return { error: error.message }
  }

  revalidatePath('/workspace/time')
  return { success: true, hours }
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

// Timesheet Submissions
export async function getTimesheetSubmission(month: string) {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const [year, monthNum] = month.split('-').map(Number)

  const { data } = await ctx.supabase
    .from('timesheet_submissions')
    .select('*')
    .eq('user_id', ctx.user.id)
    .eq('organization_id', ctx.organizationId)
    .eq('year', year)
    .eq('month', monthNum)
    .single()

  return data || null
}

export async function submitTimesheet(month: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getWorkerContext()
  if (!ctx) return { error: 'Unauthorized' }

  const [year, monthNum] = month.split('-').map(Number)
  const now = new Date().toISOString()

  const { error } = await ctx.supabase
    .from('timesheet_submissions')
    .upsert({
      organization_id: ctx.organizationId,
      user_id: ctx.user.id,
      year,
      month: monthNum,
      status: 'submitted',
      submitted_at: now,
      reviewed_at: null,
      reviewed_by: null,
      comment: null,
      updated_at: now,
    }, { onConflict: 'organization_id,user_id,year,month' })

  if (error) return { error: error.message }

  revalidatePath('/workspace/time')
  return { success: true }
}

export async function getWorkerAlerts() {
  const ctx = await getWorkerContext()
  if (!ctx) return null

  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const overdueThreshold = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()

  const [submissionResult, overdueTasksResult] = await Promise.all([
    ctx.supabase
      .from('timesheet_submissions')
      .select('status, comment')
      .eq('user_id', ctx.user.id)
      .eq('organization_id', ctx.organizationId)
      .eq('year', currentYear)
      .eq('month', currentMonth)
      .single(),
    ctx.supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', ctx.organizationId)
      .eq('assigned_to', ctx.user.id)
      .eq('status', 'assigned')
      .lte('assigned_at', overdueThreshold),
  ])

  const submission = submissionResult.data
  const overdueCount = overdueTasksResult.count || 0

  return {
    submissionStatus: submission?.status ?? null,  // null means not submitted
    rejectionComment: submission?.status === 'rejected' ? (submission.comment ?? null) : null,
    overdueTasksCount: overdueCount,
    currentMonthLabel: `${currentYear}-${String(currentMonth).padStart(2, '0')}`,
  }
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
