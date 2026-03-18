import { getMyTimeEntries, getMonthlySummary } from '@/lib/actions/worker'
import { TimeTrackingCalendar } from '@/components/workspace/time-tracking-calendar'

export default async function TimeTrackingPage() {
  const [entries, summary] = await Promise.all([
    getMyTimeEntries(),
    getMonthlySummary(),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Czas pracy</h1>
        <p className="text-muted-foreground mt-1">
          Rejestruj godziny pracy i urlopy
        </p>
      </div>

      <TimeTrackingCalendar initialEntries={entries} summary={summary} />
    </div>
  )
}
