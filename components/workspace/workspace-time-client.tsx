'use client'

import { useState, useTransition } from 'react'
import { getMyTimeEntries, getMonthlySummary, getTimesheetSubmission, submitTimesheet } from '@/lib/actions/worker'
import { TimeTrackingCalendar } from '@/components/workspace/time-tracking-calendar'
import { DownloadPdfButton } from '@/components/workspace/download-pdf-button'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Lock, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { TimeEntry, TimesheetSubmission, SubmissionStatus } from '@/lib/types'

interface MonthlySummary {
  workingDays: number
  vacationDays: number
  effectiveWorkingDays: number
  expectedHours: number
  workHours: number
  overtimeHours: number
  undertimeHours: number
  overtimePay: number
  regularPay: number
  totalPay: number
  currency: string
  hoursPerDay: number
}

interface WorkspaceTimeClientProps {
  orgName: string
  workerName: string
  workerEmail: string
  initialMonth: string
  initialEntries: TimeEntry[]
  initialSummary: MonthlySummary | null
  initialSubmission: TimesheetSubmission | null
  config: {
    hours_per_day: number
    hourly_rate: number
    overtime_multiplier: number
    currency: string
  }
}

const STATUS_CONFIG: Record<SubmissionStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; icon: React.ElementType }> = {
  draft: { label: 'Szkic', variant: 'outline', icon: Clock },
  submitted: { label: 'Oczekuje na akceptację', variant: 'secondary', icon: Send },
  approved: { label: 'Zatwierdzono', variant: 'default', icon: CheckCircle2 },
  rejected: { label: 'Odrzucono', variant: 'destructive', icon: XCircle },
}

export function WorkspaceTimeClient({
  orgName,
  workerName,
  workerEmail,
  initialMonth,
  initialEntries,
  initialSummary,
  initialSubmission,
  config,
}: WorkspaceTimeClientProps) {
  const [yearMonth, setYearMonth] = useState(initialMonth)
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [submission, setSubmission] = useState<TimesheetSubmission | null>(initialSubmission)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [, startFetching] = useTransition()

  const status: SubmissionStatus = submission?.status ?? 'draft'
  const isLocked = status === 'submitted' || status === 'approved'
  const canSubmit = status === 'draft' || status === 'rejected'
  const statusConfig = STATUS_CONFIG[status]
  const StatusIcon = statusConfig.icon

  async function fetchMonthData(ym: string) {
    const [newEntries, newSummary, newSubmission] = await Promise.all([
      getMyTimeEntries(ym),
      getMonthlySummary(ym),
      getTimesheetSubmission(ym),
    ])
    setEntries(newEntries)
    setSummary(newSummary)
    setSubmission(newSubmission)
  }

  function handleMonthChange(newYearMonth: string) {
    setYearMonth(newYearMonth)
    startFetching(async () => {
      await fetchMonthData(newYearMonth)
    })
  }

  function handleEntriesChange(newEntries: TimeEntry[], newSummary: MonthlySummary | null) {
    setEntries(newEntries)
    setSummary(newSummary)
  }

  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    const result = await submitTimesheet(yearMonth)
    if (result.error) {
      setSubmitError(result.error)
    } else {
      // Refresh submission state
      const newSubmission = await getTimesheetSubmission(yearMonth)
      setSubmission(newSubmission)
    }
    setSubmitting(false)
  }

  return (
    <>
      {/* Page header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Czas pracy</h1>
          <p className="text-muted-foreground mt-1">
            Rejestruj godziny pracy i urlopy
          </p>
        </div>
        <DownloadPdfButton
          orgName={orgName}
          workerName={workerName}
          workerEmail={workerEmail}
          month={yearMonth}
          entries={entries}
          config={config}
        />
      </div>

      {/* Submission status bar */}
      <div className="mb-6 flex items-center gap-3 rounded-lg border bg-card p-4">
        <Badge variant={statusConfig.variant} className="flex items-center gap-1.5 px-3 py-1">
          <StatusIcon className="h-3.5 w-3.5" />
          {statusConfig.label}
        </Badge>

        {status === 'rejected' && submission?.comment && (
          <p className="text-sm text-muted-foreground flex-1">
            <span className="font-medium text-destructive">Komentarz: </span>
            {submission.comment}
          </p>
        )}

        {isLocked && (
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 flex-1">
            <Lock className="h-3.5 w-3.5" />
            {status === 'approved' ? 'Miesiąc zatwierdzony — edycja zablokowana.' : 'Miesiąc wysłany do akceptacji — edycja zablokowana.'}
          </p>
        )}

        <div className="ml-auto flex items-center gap-2">
          {submitError && (
            <p className="text-sm text-destructive">{submitError}</p>
          )}
          {canSubmit && (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || entries.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Wysyłanie...' : status === 'rejected' ? 'Wyślij ponownie' : 'Wyślij do akceptacji'}
            </Button>
          )}
        </div>
      </div>

      {/* Calendar — locked when submitted/approved */}
      <TimeTrackingCalendar
        initialEntries={entries}
        summary={summary}
        initialMonth={yearMonth}
        isLocked={isLocked}
        onMonthChange={handleMonthChange}
        onEntriesChange={handleEntriesChange}
      />
    </>
  )
}
