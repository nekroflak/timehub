'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskComment, TaskStatus } from '@/lib/types'

async function getTaskContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return { supabase, user, organizationId: membership.organization_id }
}

// ----------------------------------------------------------------
// Fetch all tasks for the org, with joined profiles (separate fetch)
// ----------------------------------------------------------------
export async function getOrgTasks(): Promise<Task[]> {
  const ctx = await getTaskContext()
  if (!ctx) return []

  const { data: tasks, error } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  if (error || !tasks) return []

  // Collect unique user IDs to fetch profiles separately (avoids FK join RLS issues)
  const userIds = Array.from(
    new Set([
      ...tasks.map(t => t.assigned_to).filter(Boolean),
      ...tasks.map(t => t.created_by).filter(Boolean),
    ])
  ) as string[]

  let profileMap: Record<string, { id: string; full_name: string | null; email: string }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await ctx.supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profiles) {
      for (const p of profiles) {
        profileMap[p.id] = p
      }
    }
  }

  // Count comments per task
  const taskIds = tasks.map(t => t.id)
  let commentCounts: Record<string, number> = {}

  if (taskIds.length > 0) {
    const { data: counts } = await ctx.supabase
      .from('task_comments')
      .select('task_id')
      .in('task_id', taskIds)

    if (counts) {
      for (const c of counts) {
        commentCounts[c.task_id] = (commentCounts[c.task_id] || 0) + 1
      }
    }
  }

  return tasks.map(t => ({
    ...t,
    assignee: t.assigned_to ? profileMap[t.assigned_to] ?? null : null,
    creator: profileMap[t.created_by] ?? null,
    comments_count: commentCounts[t.id] ?? 0,
  }))
}

// ----------------------------------------------------------------
// Create a task
// ----------------------------------------------------------------
export async function createTask(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null

  if (!title) return { error: 'Tytuł jest wymagany' }

  const { error } = await ctx.supabase
    .from('tasks')
    .insert({
      organization_id: ctx.organizationId,
      title,
      description,
      status: 'todo',
      created_by: ctx.user.id,
    })

  if (error) return { error: error.message }

  revalidatePath('/workspace/board')
  return { success: true }
}

// ----------------------------------------------------------------
// Assign task to self
// ----------------------------------------------------------------
export async function assignTaskToMe(taskId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('tasks')
    .update({
      assigned_to: ctx.user.id,
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/workspace/board')
  return { success: true }
}

// ----------------------------------------------------------------
// Move task to a different status column
// ----------------------------------------------------------------
export async function moveTask(taskId: string, status: TaskStatus): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }

  // When moving back to assigned, refresh assigned_at for the 48h warning
  if (status === 'assigned') {
    updatePayload.assigned_at = new Date().toISOString()
  }

  // When moving back to todo, clear assignee
  if (status === 'todo') {
    updatePayload.assigned_to = null
    updatePayload.assigned_at = null
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .update(updatePayload)
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/workspace/board')
  return { success: true }
}

// ----------------------------------------------------------------
// Delete a task (creator or admin)
// ----------------------------------------------------------------
export async function deleteTask(taskId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { error } = await ctx.supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/workspace/board')
  return { success: true }
}

// ----------------------------------------------------------------
// Get comments for a task
// ----------------------------------------------------------------
export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const ctx = await getTaskContext()
  if (!ctx) return []

  const { data: comments, error } = await ctx.supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: true })

  if (error || !comments) return []

  const userIds = Array.from(new Set(comments.map(c => c.user_id)))
  let profileMap: Record<string, { id: string; full_name: string | null; email: string }> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await ctx.supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profiles) {
      for (const p of profiles) profileMap[p.id] = p
    }
  }

  return comments.map(c => ({
    ...c,
    author: profileMap[c.user_id] ?? null,
  }))
}

// ----------------------------------------------------------------
// Add a comment to a task
// ----------------------------------------------------------------
export async function addTaskComment(taskId: string, content: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const trimmed = content.trim()
  if (!trimmed) return { error: 'Komentarz nie może być pusty' }

  // Verify task belongs to the org
  const { data: task } = await ctx.supabase
    .from('tasks')
    .select('id, organization_id')
    .eq('id', taskId)
    .eq('organization_id', ctx.organizationId)
    .single()

  if (!task) return { error: 'Zadanie nie zostało znalezione' }

  const { error } = await ctx.supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      organization_id: ctx.organizationId,
      user_id: ctx.user.id,
      content: trimmed,
    })

  if (error) return { error: error.message }

  revalidatePath('/workspace/board')
  return { success: true }
}

// ----------------------------------------------------------------
// Get current user id (needed by client components)
// ----------------------------------------------------------------
export async function getCurrentUserId(): Promise<string | null> {
  const ctx = await getTaskContext()
  return ctx?.user.id ?? null
}
