'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { UserCheck, AlertTriangle, Loader2, Send, Trash2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Task, TaskComment, TaskStatus } from '@/lib/types'
import {
  getTaskComments,
  addTaskComment,
  assignTaskToMe,
  moveTask,
  deleteTask,
} from '@/lib/actions/tasks'
import { AssignUserDialog } from './assign-user-dialog'

interface OrgMember {
  id: string
  full_name: string | null
  email: string
}

interface TaskDetailSheetProps {
  task: Task
  currentUserId: string
  orgMembers: OrgMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'Do zrobienia',
  assigned: 'Przypisane',
  done: 'Zrobione',
}

function isOverdue(task: Task): boolean {
  if (task.status !== 'assigned' || !task.assigned_at) return false
  return Date.now() - new Date(task.assigned_at).getTime() >= 48 * 60 * 60 * 1000
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TaskDetailSheet({ task, currentUserId, orgMembers, open, onOpenChange }: TaskDetailSheetProps) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)

  const overdue = isOverdue(task)
  const isAssignedToMe = task.assigned_to === currentUserId
  const isUnassigned = !task.assigned_to
  const isCreator = task.created_by === currentUserId

  useEffect(() => {
    if (!open) return
    setLoadingComments(true)
    getTaskComments(task.id).then(data => {
      setComments(data)
      setLoadingComments(false)
    })
  }, [open, task.id])

  function handleAssignToMe() {
    startTransition(async () => {
      const result = await assignTaskToMe(task.id)
      if (result.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleStatusChange(newStatus: string) {
    startTransition(async () => {
      const result = await moveTask(task.id, newStatus as TaskStatus)
      if (result.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  function handleAddComment() {
    if (!commentText.trim()) return
    startTransition(async () => {
      const result = await addTaskComment(task.id, commentText)
      if (result.error) {
        setError(result.error)
      } else {
        setCommentText('')
        const fresh = await getTaskComments(task.id)
        setComments(fresh)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (result.error) setError(result.error)
      else onOpenChange(false)
    })
  }

  const assigneeName = task.assignee
    ? (task.assignee.full_name || task.assignee.email)
    : null
  const creatorName = task.creator
    ? (task.creator.full_name || task.creator.email)
    : 'Nieznany'

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-lg overflow-y-auto">
        <SheetHeader className="pb-2">
          <SheetTitle className={cn('text-left text-base font-semibold', overdue && 'text-destructive')}>
            {task.title}
          </SheetTitle>
        </SheetHeader>

        {/* Overdue warning */}
        {overdue && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <span className="text-sm text-destructive font-medium">Zadanie jest przypisane od ponad 48 godzin</span>
          </div>
        )}

        {/* Status + meta */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <Select defaultValue={task.status} onValueChange={handleStatusChange} disabled={isPending}>
              <SelectTrigger className="h-7 w-36 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todo">Do zrobienia</SelectItem>
                <SelectItem value="assigned">Przypisane</SelectItem>
                <SelectItem value="done">Zrobione</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Assignee row */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
            <UserCheck className="h-4 w-4 shrink-0" />
            <span className="truncate">{assigneeName ?? 'Nieprzypisane'}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isUnassigned && (
              <Button size="sm" variant="outline" onClick={handleAssignToMe} disabled={isPending}>
                {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Przypisz do mnie
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAssignDialogOpen(true)}
              disabled={isPending}
            >
              <Users className="h-3 w-3 mr-1" />
              {isUnassigned ? 'Przypisz do...' : 'Zmień osobę'}
            </Button>
          </div>
        </div>

        {/* Assign user dialog */}
        <AssignUserDialog
          taskId={task.id}
          currentAssigneeId={task.assigned_to}
          members={orgMembers}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onAssigned={() => onOpenChange(false)}
        />

        {/* Description */}
        {task.description && (
          <div className="mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Opis</p>
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{task.description}</p>
          </div>
        )}

        {/* Meta info */}
        <div className="mb-4 text-xs text-muted-foreground space-y-1">
          <p>Utworzono przez: <span className="text-foreground">{creatorName}</span></p>
          <p>Data utworzenia: <span className="text-foreground">{formatDate(task.created_at)}</span></p>
          {task.assigned_at && (
            <p>Przypisano: <span className="text-foreground">{formatDate(task.assigned_at)}</span></p>
          )}
        </div>

        {/* Error */}
        {error && (
          <p className="mb-3 text-xs text-destructive">{error}</p>
        )}

        <Separator className="mb-4" />

        {/* Comments */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Komentarze ({comments.length})
          </p>

          {loadingComments ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground/60 py-2">Brak komentarzy</p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map(c => (
                <div key={c.id} className="rounded-md border bg-muted/40 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">
                      {c.author?.full_name || c.author?.email || 'Użytkownik'}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDate(c.created_at)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment */}
          <div className="flex gap-2">
            <Textarea
              placeholder="Dodaj komentarz..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAddComment()
              }}
              className="min-h-[60px] text-sm resize-none"
              disabled={isPending}
            />
            <Button
              size="icon"
              onClick={handleAddComment}
              disabled={!commentText.trim() || isPending}
              className="shrink-0 self-end"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Ctrl+Enter aby wysłać</p>
        </div>

        <Separator className="mb-4" />

        {/* Delete */}
        {(isCreator) && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            disabled={isPending}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Usuń zadanie
          </Button>
        )}
      </SheetContent>
    </Sheet>
  )
}
