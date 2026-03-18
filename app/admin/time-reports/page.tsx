import { getOrgTimeEntries } from '@/lib/actions/admin'
import { TimeReportsList } from '@/components/admin/time-reports-list'

export default async function TimeReportsPage() {
  const timeEntries = await getOrgTimeEntries()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Time Reports</h1>
        <p className="text-muted-foreground mt-1">
          View time entries from all team members
        </p>
      </div>

      <TimeReportsList entries={timeEntries} />
    </div>
  )
}
