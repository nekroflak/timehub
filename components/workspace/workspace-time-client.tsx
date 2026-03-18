'use client'

import { useState, useTransition } from 'react'
import { getMyTimeEntries, getMonthlySummary } from '@/lib/actions/worker'
import { TimeTrackingCalendar } from '@/components/workspace/time-tracking-calendar'
import { DownloadPdfButton } from '@/components/workspace/download-pdf-button'
import type { TimeEntry } from '@/lib/types'

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
  config: {
    hours_per_day: number
    hourly_rate: number
    overtime_multiplier: number
    currency: string
  }
}

export function WorkspaceTimeClient({
  orgName,
  workerName,
  workerEmail,
  initialMonth,
  initialEntries,
  initialSummary,
  config,
}: WorkspaceTimeClientProps) {
  // Single source of truth for selected month — shared between calendar and PDF button
  const [yearMonth, setYearMonth] = useState(initialMonth)
  const [entries, setEntries] = useState<TimeEntry[]>(initialEntries)
  const [summary, setSummary] = useState<MonthlySummary | null>(initialSummary)
  const [, startFetching] = useTransition()

  function handleMonthChange(newYearMonth: string) {
    setYearMonth(newYearMonth)
    startFetching(async () => {
      const [newEntries, newSummary] = await Promise.all([
        getMyTimeEntries(newYearMonth),
        getMonthlySummary(newYearMonth),
      ])
      setEntries(newEntries)
      setSummary(newSummary)
    })
  }

  function handleEntriesChange(newEntries: TimeEntry[], newSummary: MonthlySummary | null) {
    setEntries(newEntries)
    setSummary(newSummary)
  }

  return (
    <>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Czas pracy</h1>
          <p className="text-muted-foreground mt-1">
            Rejestruj godziny pracy i urlopy
          </p>
        </div>
        {/* PDF button always receives the currently viewed month and entries */}
        <DownloadPdfButton
          orgName={orgName}
          workerName={workerName}
          workerEmail={workerEmail}
          month={yearMonth}
          entries={entries}
          config={config}
        />
      </div>

      <TimeTrackingCalendar
        initialEntries={entries}
        summary={summary}
        initialMonth={yearMonth}
        onMonthChange={handleMonthChange}
        onEntriesChange={handleEntriesChange}
      />
    </>
  )
}
