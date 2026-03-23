import { Suspense } from 'react'
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
import { Sun, Loader2 } from 'lucide-react'
import type { CalendarEvent } from '@/lib/actions/calendar'

// Async component — renders separately via Suspense so it never blocks tasks
async function CalendarSection() {
  const [isGoogleConnected, isOutlookConnected] = await Promise.all([
    getCalendarConnectionStatus(),
    getOutlookConnectionStatus(),
  ])

  const [googleEvents, outlookEvents] = await Promise.all([
    isGoogleConnected ? getTodayCalendarEvents() : Promise.resolve([] as CalendarEvent[]),
    isOutlookConnected ? getTodayOutlookEvents() : Promise.resolve([] as CalendarEvent[]),
  ])

  const calendarEvents = [...googleEvents, ...outlookEvents].sort((a, b) => {
    const ta = a.start.dateTime ?? a.start.date ?? ''
    const tb = b.start.dateTime ?? b.start.date ?? ''
    return ta.localeCompare(tb)
  })

  return (
    <div className="space-y-4">
      <CalendarConnectCard
        isGoogleConnected={isGoogleConnected}
        isOutlookConnected={isOutlookConnected}
      />
      {(isGoogleConnected || isOutlookConnected) && (
        <CalendarEventsList events={calendarEvents} />
      )}
    </div>
  )
}

function CalendarSectionSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 flex items-center justify-center gap-2 text-muted-foreground text-sm min-h-[120px]">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Ładowanie kalendarza...</span>
    </div>
  )
}

export default async function TodayPage() {
  // Only load tasks — no calendar DB or HTTP calls here
  const [currentUserId, allTasks] = await Promise.all([
    getCurrentUserId(),
    getOrgTasks(),
  ])

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
        {/* Left column: tasks — renders immediately */}
        <div className="space-y-4">
          <TodayTasksList tasks={myTasks} />
        </div>

        {/* Right column: calendar — streams in separately via Suspense */}
        <Suspense fallback={<CalendarSectionSkeleton />}>
          <CalendarSection />
        </Suspense>
      </div>
    </div>
  )
}
