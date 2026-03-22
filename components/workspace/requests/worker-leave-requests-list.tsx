'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, MessageSquare } from 'lucide-react'
import { deleteLeaveRequest } from '@/lib/actions/leave-requests'
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '@/lib/types'
import type { LeaveRequest } from '@/lib/types'
import { cn } from '@/lib/utils'

const statusVariant: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
  rejected: 'bg-destructive/10 text-destructive',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function dayCount(from: string, to: string) {
  const diff = (new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)
  return Math.round(diff) + 1
}

interface Props {
  requests: LeaveRequest[]
}

export function WorkerLeaveRequestsList({ requests }: Props) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleDelete(id: string) {
    setDeletingId(id)
    startTransition(async () => {
      await deleteLeaveRequest(id)
      setDeletingId(null)
    })
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground text-sm">Nie masz jeszcze żadnych wniosków.</p>
        <p className="text-muted-foreground text-xs mt-1">Kliknij &quot;Nowy wniosek&quot; aby dodać pierwszy.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <Card key={req.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{LEAVE_TYPE_LABELS[req.type]}</span>
                  <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusVariant[req.status])}>
                    {LEAVE_STATUS_LABELS[req.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDate(req.date_from)} – {formatDate(req.date_to)}
                  <span className="ml-2 text-xs">({dayCount(req.date_from, req.date_to)} {dayCount(req.date_from, req.date_to) === 1 ? 'dzień' : 'dni'})</span>
                </p>
                {req.worker_note && (
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{req.worker_note}</p>
                )}
                {req.admin_comment && (
                  <div className="mt-2 flex items-start gap-1.5 rounded-md bg-muted/50 px-2.5 py-2">
                    <MessageSquare className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">{req.admin_comment}</p>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString('pl-PL')}
                </span>
                {req.status === 'pending' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(req.id)}
                    disabled={isPending && deletingId === req.id}
                    aria-label="Usuń wniosek"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
