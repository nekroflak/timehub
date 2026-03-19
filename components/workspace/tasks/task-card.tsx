'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, UserCheck, AlertTriangle, User } from 'lucide-react'
import type { Task } from '@/lib/types'
import { TaskDetailSheet } from './task-detail-sheet'

interface OrgMember {
  id: string
  full_name: string | null
  email: string
}

interface TaskCardProps {
  task: Task
  currentUserId: string
  orgMembers: OrgMember[]
}

function isOverdue(task: Task): boolean {
  if (task.status !== 'assigned' || !task.assigned_at) return false
  const assignedMs = new Date(task.assigned_at).getTime()
  const nowMs = Date.now()
  return nowMs - assignedMs >= 48 * 60 * 60 * 1000
}

export function TaskCard({ task, currentUserId, orgMembers }: TaskCardProps) {
  const [detailOpen, setDetailOpen] = useState(false)
  const overdue = isOverdue(task)

  const assigneeName = task.assignee
    ? (task.assignee.full_name || task.assignee.email)
    : null

  return (
    <>
      <div
        onClick={() => setDetailOpen(true)}
        className={cn(
          'group cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md',
          overdue && 'border-destructive/50 bg-destructive/5'
        )}
      >
        {/* Overdue badge */}
        {overdue && (
          <div className="mb-2 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 text-destructive" />
            <span className="text-xs font-semibold text-destructive">48h+ — Po terminie</span>
          </div>
        )}

        {/* Title */}
        <p className={cn(
          'text-sm font-medium leading-snug',
          overdue && 'text-destructive'
        )}>
          {task.title}
        </p>

        {/* Description preview */}
        {task.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {assigneeName ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <UserCheck className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{assigneeName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                <User className="h-3 w-3" />
                <span>Nieprzypisane</span>
              </div>
            )}
          </div>

          {(task.comments_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              <span>{task.comments_count}</span>
            </div>
          )}
        </div>
      </div>

      <TaskDetailSheet
        task={task}
        currentUserId={currentUserId}
        orgMembers={orgMembers}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </>
  )
}
