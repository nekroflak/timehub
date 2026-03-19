'use client'

import { useState, useTransition } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Loader2, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { assignTaskToUser } from '@/lib/actions/tasks'

interface OrgMember {
  id: string
  full_name: string | null
  email: string
}

interface AssignUserDialogProps {
  taskId: string
  currentAssigneeId: string | null
  members: OrgMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onAssigned?: () => void
}

export function AssignUserDialog({
  taskId,
  currentAssigneeId,
  members,
  open,
  onOpenChange,
  onAssigned,
}: AssignUserDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assigningId, setAssigningId] = useState<string | null>(null)

  function handleAssign(userId: string) {
    setAssigningId(userId)
    setError(null)
    startTransition(async () => {
      const result = await assignTaskToUser(taskId, userId)
      if (result.error) {
        setError(result.error)
        setAssigningId(null)
      } else {
        onOpenChange(false)
        onAssigned?.()
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base">Przypisz zadanie do...</DialogTitle>
        </DialogHeader>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        <div className="flex flex-col gap-1 mt-1">
          {members.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Brak członków organizacji
            </p>
          )}
          {members.map(member => {
            const isCurrentAssignee = member.id === currentAssigneeId
            const isLoading = isPending && assigningId === member.id
            const displayName = member.full_name || member.email

            return (
              <button
                key={member.id}
                onClick={() => !isCurrentAssignee && handleAssign(member.id)}
                disabled={isPending || isCurrentAssignee}
                className={cn(
                  'flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors',
                  isCurrentAssignee
                    ? 'bg-primary/10 text-primary cursor-default'
                    : 'hover:bg-muted cursor-pointer',
                  isPending && !isLoading && 'opacity-50',
                )}
              >
                <div className="flex flex-col">
                  <span className="font-medium">{displayName}</span>
                  {member.full_name && (
                    <span className="text-xs text-muted-foreground">{member.email}</span>
                  )}
                </div>
                <div className="shrink-0 ml-2">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : isCurrentAssignee ? (
                    <UserCheck className="h-4 w-4 text-primary" />
                  ) : null}
                </div>
              </button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
