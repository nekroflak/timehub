import { getMyTimeEntries } from '@/lib/actions/worker'
import { TimeTrackingCalendar } from '@/components/workspace/time-tracking-calendar'

export default async function TimeTrackingPage() {
  const entries = await getMyTimeEntries()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Time Tracking</h1>
        <p className="text-muted-foreground mt-1">
          Log your work hours and track your time
        </p>
      </div>

      <TimeTrackingCalendar initialEntries={entries} />
    </div>
  )
}
