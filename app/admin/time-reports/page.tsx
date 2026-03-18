import { getOrgTimeEntries, getAdminStats } from '@/lib/actions/admin'
import { TimeReportsList } from '@/components/admin/time-reports-list'
import { DownloadReportButton } from '@/components/admin/download-report-button'

export default async function TimeReportsPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const [timeEntries, stats] = await Promise.all([
    getOrgTimeEntries(),
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
        <DownloadReportButton
          orgName={orgName}
          month={currentMonth}
          entries={timeEntries}
        />
      </div>

      <TimeReportsList entries={timeEntries} />
    </div>
  )
}
