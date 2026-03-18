import { getOrgTimeEntries, getAdminStats } from '@/lib/actions/admin'
import { TimeReportsList } from '@/components/admin/time-reports-list'
import { DownloadReportButton } from '@/components/admin/download-report-button'
import { MonthPicker } from '@/components/admin/month-picker'
import { Suspense } from 'react'

interface TimeReportsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function TimeReportsPage({ searchParams }: TimeReportsPageProps) {
  const params = await searchParams
  const now = new Date()
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  // Single source of truth for selected month
  const selectedMonth = params.month || defaultMonth

  const [year, month] = selectedMonth.split('-').map(Number)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [timeEntries, stats] = await Promise.all([
    getOrgTimeEntries(startDate, endDate),
    getAdminStats(),
  ])

  const orgName = stats?.organizationName ?? 'Organizacja'

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Raporty czasu pracy</h1>
          <p className="text-muted-foreground mt-1">
            Wpisy czasu pracy wszystkich pracowników
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <MonthPicker currentMonth={selectedMonth} />
          </Suspense>
          <DownloadReportButton
            orgName={orgName}
            month={selectedMonth}
            entries={timeEntries}
          />
        </div>
      </div>

      <TimeReportsList entries={timeEntries} selectedMonth={selectedMonth} />
    </div>
  )
}
