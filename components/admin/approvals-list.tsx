'use client'

import { useState, useTransition } from 'react'
import { approveSubmission, rejectSubmission } from '@/lib/actions/approvals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { CheckCircle2, XCircle, Clock, Send, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TimesheetSubmission, SubmissionStatus } from '@/lib/types'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  draft: { label: 'Szkic', variant: 'outline', icon: Clock },
  submitted: { label: 'Oczekuje', variant: 'secondary', icon: Send },
  approved: { label: 'Zatwierdzone', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Odrzucone', variant: 'destructive', icon: XCircle },
}

interface ApprovalsListProps {
  submissions: TimesheetSubmission[]
  members: { user_id: string; profile: { full_name: string | null; email: string } | null }[]
}

export function ApprovalsList({ submissions: initialSubmissions, members }: ApprovalsListProps) {
  const [submissions, setSubmissions] = useState<TimesheetSubmission[]>(initialSubmissions)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterUserId, setFilterUserId] = useState<string>('all')

  // Detail modal state
  const [selected, setSelected] = useState<TimesheetSubmission | null>(null)
  const [rejectComment, setRejectComment] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = submissions.filter(s => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterUserId !== 'all' && s.user_id !== filterUserId) return false
    return true
  })

  console.log('[v0] ApprovalsList: total submissions =', submissions.length, '| filtered =', filtered.length, '| filterStatus =', filterStatus, '| filterUserId =', filterUserId)

  function openDetail(sub: TimesheetSubmission) {
    setSelected(sub)
    setShowRejectForm(false)
    setRejectComment('')
    setActionError(null)
  }

  function handleApprove() {
    if (!selected) return
    startTransition(async () => {
      const result = await approveSubmission(selected.id)
      if (result.error) {
        setActionError(result.error)
      } else {
        setSubmissions(prev => prev.map(s =>
          s.id === selected.id ? { ...s, status: 'approved' as SubmissionStatus, reviewed_at: new Date().toISOString() } : s
        ))
        setSelected(null)
      }
    })
  }

  function handleReject() {
    if (!selected) return
    startTransition(async () => {
      const result = await rejectSubmission(selected.id, rejectComment)
      if (result.error) {
        setActionError(result.error)
      } else {
        setSubmissions(prev => prev.map(s =>
          s.id === selected.id ? { ...s, status: 'rejected' as SubmissionStatus, comment: rejectComment, reviewed_at: new Date().toISOString() } : s
        ))
        setSelected(null)
      }
    })
  }

  return (
    <>
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="submitted">Oczekuje</SelectItem>
                <SelectItem value="approved">Zatwierdzone</SelectItem>
                <SelectItem value="rejected">Odrzucone</SelectItem>
                <SelectItem value="draft">Szkic</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterUserId} onValueChange={setFilterUserId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Pracownik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszyscy pracownicy</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.profile?.full_name || m.profile?.email || m.user_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground ml-auto">
              {filtered.length} {filtered.length === 1 ? 'wpis' : 'wpisów'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Submissions list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">Brak zgłoszeń</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Brak arkuszy czasu pracy spełniających kryteria filtrów
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filtered.map(sub => {
                const statusCfg = STATUS_CONFIG[sub.status]
                const StatusIcon = statusCfg.icon
                const name = sub.profile?.full_name || sub.profile?.email || 'Nieznany'
                const monthLabel = `${MONTH_NAMES[sub.month - 1]} ${sub.year}`
                return (
                  <div
                    key={sub.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-muted/40 cursor-pointer transition-colors"
                    onClick={() => openDetail(sub)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{monthLabel}</p>
                    </div>
                    <Badge variant={statusCfg.variant} className="flex items-center gap-1.5 shrink-0">
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                    {sub.submitted_at && (
                      <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                        {new Date(sub.submitted_at).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                    {sub.status === 'submitted' && (
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-700 border-green-300 hover:bg-green-50"
                          onClick={e => { e.stopPropagation(); setSelected(sub); setShowRejectForm(false); setActionError(null) }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Zatwierdź
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={e => { e.stopPropagation(); setSelected(sub); setShowRejectForm(true); setActionError(null) }}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Odrzuć
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail / Action Modal */}
      <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null) }}>
        <DialogContent>
          {selected && (() => {
            const statusCfg = STATUS_CONFIG[selected.status]
            const StatusIcon = statusCfg.icon
            const name = selected.profile?.full_name || selected.profile?.email || 'Nieznany'
            const monthLabel = `${MONTH_NAMES[selected.month - 1]} ${selected.year}`
            return (
              <>
                <DialogHeader>
                  <DialogTitle>{name}</DialogTitle>
                  <DialogDescription>{monthLabel}</DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Badge variant={statusCfg.variant} className="flex items-center gap-1.5">
                      <StatusIcon className="h-3 w-3" />
                      {statusCfg.label}
                    </Badge>
                  </div>

                  {selected.submitted_at && (
                    <p className="text-sm text-muted-foreground">
                      Wysłano: {new Date(selected.submitted_at).toLocaleString('pl-PL')}
                    </p>
                  )}

                  {selected.reviewed_at && (
                    <p className="text-sm text-muted-foreground">
                      Rozpatrzono: {new Date(selected.reviewed_at).toLocaleString('pl-PL')}
                    </p>
                  )}

                  {selected.comment && (
                    <div className={cn('p-3 rounded-md text-sm', selected.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-muted')}>
                      <span className="font-medium">Komentarz: </span>{selected.comment}
                    </div>
                  )}

                  {actionError && (
                    <p className="text-sm text-destructive">{actionError}</p>
                  )}

                  {selected.status === 'submitted' && !showRejectForm && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={handleApprove}
                        disabled={isPending}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        {isPending ? 'Przetwarzanie...' : 'Zatwierdź'}
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={() => setShowRejectForm(true)}
                        disabled={isPending}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Odrzuć
                      </Button>
                    </div>
                  )}

                  {selected.status === 'submitted' && showRejectForm && (
                    <div className="flex flex-col gap-3 pt-2">
                      <div className="flex flex-col gap-1.5">
                        <Label htmlFor="reject-comment">Komentarz (opcjonalnie)</Label>
                        <Textarea
                          id="reject-comment"
                          value={rejectComment}
                          onChange={e => setRejectComment(e.target.value)}
                          placeholder="Podaj powód odrzucenia..."
                          rows={3}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowRejectForm(false)}
                          disabled={isPending}
                        >
                          Anuluj
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleReject}
                          disabled={isPending}
                          className="flex-1"
                        >
                          {isPending ? 'Odrzucanie...' : 'Potwierdź odrzucenie'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </>
  )
}
