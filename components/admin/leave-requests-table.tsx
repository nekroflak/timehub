'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Check, X, MessageSquare } from 'lucide-react'
import { reviewLeaveRequest } from '@/lib/actions/leave-requests'
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '@/lib/types'
import type { LeaveRequest, LeaveRequestStatus, LeaveRequestType } from '@/lib/types'
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
  return Math.round((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1
}

interface ReviewDialogProps {
  request: LeaveRequest
  decision: 'approved' | 'rejected'
  onClose: () => void
}

function ReviewDialog({ request, decision, onClose }: ReviewDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [comment, setComment] = useState('')

  function handleSubmit() {
    setError(null)
    startTransition(async () => {
      const result = await reviewLeaveRequest(request.id, decision, comment || undefined)
      if (result.error) {
        setError(result.error)
      } else {
        onClose()
      }
    })
  }

  const workerName = request.profile?.full_name || request.profile?.email || 'Pracownik'

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {decision === 'approved' ? 'Zatwierdź wniosek' : 'Odrzuć wniosek'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="rounded-md bg-muted/50 p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Pracownik:</span> {workerName}</p>
            <p><span className="text-muted-foreground">Typ:</span> {LEAVE_TYPE_LABELS[request.type]}</p>
            <p><span className="text-muted-foreground">Okres:</span> {formatDate(request.date_from)} – {formatDate(request.date_to)}</p>
            {request.worker_note && (
              <p><span className="text-muted-foreground">Notatka:</span> {request.worker_note}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin_comment">
              Komentarz {decision === 'rejected' ? '(zalecany)' : '(opcjonalny)'}
            </Label>
            <Textarea
              id="admin_comment"
              value={comment}
              onChange={e => setComment(e.target.value)}
              rows={3}
              placeholder="Dodaj komentarz dla pracownika..."
              className="resize-none"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Anuluj</Button>
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              variant={decision === 'rejected' ? 'destructive' : 'default'}
            >
              {isPending
                ? 'Zapisywanie...'
                : decision === 'approved' ? 'Zatwierdź' : 'Odrzuć'
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface Props {
  requests: LeaveRequest[]
  members: { id: string; profile?: { full_name?: string | null; email?: string | null } | null }[]
}

export function AdminLeaveRequestsTable({ requests, members }: Props) {
  const [statusFilter, setStatusFilter] = useState<LeaveRequestStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<LeaveRequestType | 'all'>('all')
  const [memberFilter, setMemberFilter] = useState<string>('all')
  const [reviewing, setReviewing] = useState<{ request: LeaveRequest; decision: 'approved' | 'rejected' } | null>(null)

  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    if (typeFilter !== 'all' && r.type !== typeFilter) return false
    if (memberFilter !== 'all' && r.user_id !== memberFilter) return false
    return true
  })

  return (
    <>
      {reviewing && (
        <ReviewDialog
          request={reviewing.request}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Select value={statusFilter} onValueChange={v => setStatusFilter(v as LeaveRequestStatus | 'all')}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie statusy</SelectItem>
            {(Object.entries(LEAVE_STATUS_LABELS) as [LeaveRequestStatus, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={v => setTypeFilter(v as LeaveRequestType | 'all')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Typ wniosku" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszystkie typy</SelectItem>
            {(Object.entries(LEAVE_TYPE_LABELS) as [LeaveRequestType, string][]).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={memberFilter} onValueChange={setMemberFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Pracownik" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Wszyscy pracownicy</SelectItem>
            {members.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.profile?.full_name || m.profile?.email || m.id}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">Brak wniosków spełniających kryteria filtrów.</p>
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Pracownik</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Typ</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Okres</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Uwagi</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(req => {
                const workerName = req.profile?.full_name || req.profile?.email || '—'
                const days = dayCount(req.date_from, req.date_to)
                return (
                  <tr key={req.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{workerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{LEAVE_TYPE_LABELS[req.type]}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(req.date_from)} – {formatDate(req.date_to)}
                      <span className="ml-1.5 text-xs">({days}d)</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', statusVariant[req.status])}>
                        {LEAVE_STATUS_LABELS[req.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      {req.worker_note || req.admin_comment ? (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{req.admin_comment || req.worker_note}</span>
                        </span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {req.status === 'pending' ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-green-700 border-green-300 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                            onClick={() => setReviewing({ request: req, decision: 'approved' })}
                          >
                            <Check className="h-3.5 w-3.5" />
                            Zatwierdź
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => setReviewing({ request: req, decision: 'rejected' })}
                          >
                            <X className="h-3.5 w-3.5" />
                            Odrzuć
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {req.reviewed_at ? new Date(req.reviewed_at).toLocaleDateString('pl-PL') : '—'}
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
