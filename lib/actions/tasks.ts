'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Task, TaskComment, TaskStatus, Department } from '@/lib/types'

async function getTaskContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, role, department_id')
    .eq('user_id', user.id)
    .single()

  if (!membership) return null

  return {
    supabase,
    user,
    organizationId: membership.organization_id,
    orgRole: membership.role as 'admin' | 'worker',
    departmentId: membership.department_id as string | null,
  }
}

// ----------------------------------------------------------------
// Fetch tasks for the org.
// Workers only see tasks in their own department.
// Admins see all tasks (optionally filtered by departmentId param).
// ----------------------------------------------------------------
export async function getOrgTasks(filterDepartmentId?: string): Promise<Task[]> {
  const ctx = await getTaskContext()
  if (!ctx) return []

  let query = ctx.supabase
    .from('tasks')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('created_at', { ascending: false })

  // Workers are scoped to their own department
  if (ctx.orgRole === 'worker') {
    if (ctx.departmentId) {
      query = query.eq('department_id', ctx.departmentId)
    }
    // If worker has no department set, they see no tasks (safe fallback)
    else {
      return []
    }
  } else if (filterDepartmentId) {
    // Admin filtering by a specific department
    query = query.eq('department_id', filterDepartmentId)
  }

  const { data: tasks, error } = await query
  if (error || !tasks) return []

  // Collect unique user IDs for profiles
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
      for (const p of profiles) profileMap[p.id] = p
    }
  }

  // Collect department IDs for department name lookup
  const deptIds = Array.from(new Set(tasks.map(t => t.department_id).filter(Boolean))) as string[]
  let deptMap: Record<string, { id: string; name: string }> = {}
  if (deptIds.length > 0) {
    const { data: depts } = await ctx.supabase
      .from('departments')
      .select('id, name')
      .in('id', deptIds)
    if (depts) {
      for (const d of depts) deptMap[d.id] = d
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
    department: t.department_id ? deptMap[t.department_id] ?? null : null,
  }))
}

// ----------------------------------------------------------------
// Create a task — workers always get their own department_id
// ----------------------------------------------------------------
export async function createTask(formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!title) return { error: 'Tytuł jest wymagany' }

  // Admin may pass a department_id via the form; worker always uses their own
  let departmentId: string | null = null
  if (ctx.orgRole === 'admin') {
    const formDept = formData.get('department_id') as string | null
    departmentId = formDept || null
  } else {
    departmentId = ctx.departmentId
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .insert({
      organization_id: ctx.organizationId,
      title,
      description,
      status: 'todo',
      created_by: ctx.user.id,
      department_id: departmentId,
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

  if (status === 'assigned') {
    updatePayload.assigned_at = new Date().toISOString()
  }
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
// Delete a task
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
// Assign task to a specific org member
// ----------------------------------------------------------------
export async function assignTaskToUser(taskId: string, userId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }

  const { data: membership } = await ctx.supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', ctx.organizationId)
    .eq('user_id', userId)
    .single()

  if (!membership) return { error: 'Użytkownik nie należy do tej organizacji' }

  const { error } = await ctx.supabase
    .from('tasks')
    .update({
      assigned_to: userId,
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
// Get all members of the current org (for assignment picker)
// ----------------------------------------------------------------
export async function getOrgMembers(): Promise<{ id: string; full_name: string | null; email: string }[]> {
  const ctx = await getTaskContext()
  if (!ctx) return []

  const { data: members } = await ctx.supabase
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', ctx.organizationId)

  if (!members || members.length === 0) return []

  const userIds = members.map(m => m.user_id)

  const { data: profiles } = await ctx.supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', userIds)

  return profiles ?? []
}

// ----------------------------------------------------------------
// Get current user id and role (needed by client components)
// ----------------------------------------------------------------
export async function getCurrentUserId(): Promise<string | null> {
  const ctx = await getTaskContext()
  return ctx?.user.id ?? null
}

export async function getCurrentUserRole(): Promise<{ userId: string; orgRole: 'admin' | 'worker' } | null> {
  const ctx = await getTaskContext()
  if (!ctx) return null
  return { userId: ctx.user.id, orgRole: ctx.orgRole }
}

// ----------------------------------------------------------------
// Departments — CRUD (admin only)
// ----------------------------------------------------------------
export async function getOrgDepartments(): Promise<Department[]> {
  const ctx = await getTaskContext()
  if (!ctx) return []

  const { data } = await ctx.supabase
    .from('departments')
    .select('*')
    .eq('organization_id', ctx.organizationId)
    .order('name', { ascending: true })

  return data ?? []
}

export async function createDepartment(name: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }
  if (ctx.orgRole !== 'admin') return { error: 'Brak uprawnień' }

  const trimmed = name.trim()
  if (!trimmed) return { error: 'Nazwa działu jest wymagana' }

  const { error } = await ctx.supabase
    .from('departments')
    .insert({ organization_id: ctx.organizationId, name: trimmed })

  if (error) return { error: error.message }

  revalidatePath('/admin/departments')
  revalidatePath('/workspace/board')
  return { success: true }
}

export async function deleteDepartment(departmentId: string): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }
  if (ctx.orgRole !== 'admin') return { error: 'Brak uprawnień' }

  const { error } = await ctx.supabase
    .from('departments')
    .delete()
    .eq('id', departmentId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/departments')
  revalidatePath('/workspace/board')
  return { success: true }
}

export async function assignMemberDepartment(
  membershipId: string,
  departmentId: string | null,
): Promise<{ error?: string; success?: boolean }> {
  const ctx = await getTaskContext()
  if (!ctx) return { error: 'Unauthorized' }
  if (ctx.orgRole !== 'admin') return { error: 'Brak uprawnień' }

  const { error } = await ctx.supabase
    .from('organization_members')
    .update({ department_id: departmentId })
    .eq('id', membershipId)
    .eq('organization_id', ctx.organizationId)

  if (error) return { error: error.message }

  revalidatePath('/admin/team')
  return { success: true }
}
