import {
  getCalendarConnectionStatus,
  getTodayCalendarEvents,
  getOutlookConnectionStatus,
  getTodayOutlookEvents,
} from '@/lib/actions/calendar'
import { getOrgTasks, getCurrentUserId } from '@/lib/actions/tasks'
import { CalendarConnectCard } from '@/components/workspace/today/calendar-connect-card'
import { CalendarEventsList } from '@/components/workspace/today/calendar-events-list'
import { TodayTasksList } from '@/components/workspace/today/today-tasks-list'
import { Sun } from 'lucide-react'
import type { CalendarEvent } from '@/lib/actions/calendar'

export default async function TodayPage() {
  const [isGoogleConnected, isOutlookConnected, currentUserId, allTasks] = await Promise.all([
    getCalendarConnectionStatus(),
    getOutlookConnectionStatus(),
    getCurrentUserId(),
    getOrgTasks(),
  ])

  // Fetch events from connected providers in parallel
  const [googleEvents, outlookEvents] = await Promise.all([
    isGoogleConnected ? getTodayCalendarEvents() : Promise.resolve([] as CalendarEvent[]),
    isOutlookConnected ? getTodayOutlookEvents() : Promise.resolve([] as CalendarEvent[]),
  ])

  // Merge and sort by start time
  const calendarEvents = [...googleEvents, ...outlookEvents].sort((a, b) => {
    const ta = a.start.dateTime ?? a.start.date ?? ''
    const tb = b.start.dateTime ?? b.start.date ?? ''
    return ta.localeCompare(tb)
  })

  const myTasks = allTasks.filter(
    t => t.assigned_to === currentUserId && t.status !== 'done'
  )

  const today = new Date().toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const todayLabel = today.charAt(0).toUpperCase() + today.slice(1)

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
          <Sun className="h-4 w-4" />
          <span>{todayLabel}</span>
        </div>
        <h1 className="text-3xl font-bold">Mój dzień</h1>
        <p className="text-muted-foreground mt-1">
          Twoje zadania i wydarzenia na dziś
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: tasks */}
        <div className="space-y-4">
          <TodayTasksList tasks={myTasks} />
        </div>

        {/* Right column: calendar */}
        <div className="space-y-4">
          <CalendarConnectCard
            isGoogleConnected={isGoogleConnected}
            isOutlookConnected={isOutlookConnected}
          />
          {(isGoogleConnected || isOutlookConnected) && (
            <CalendarEventsList events={calendarEvents} />
          )}
        </div>
      </div>
    </div>
  )
}
