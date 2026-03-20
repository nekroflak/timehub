import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react'
import type { CalendarEvent } from '@/lib/actions/calendar'

interface CalendarEventsListProps {
  events: CalendarEvent[]
}

function formatEventTime(event: CalendarEvent): string {
  if (event.start.date) return 'Cały dzień'
  if (!event.start.dateTime) return ''
  const start = new Date(event.start.dateTime)
  const end = event.end.dateTime ? new Date(event.end.dateTime) : null
  const fmt = (d: Date) =>
    d.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', hour12: false })
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start)
}

function isOngoing(event: CalendarEvent): boolean {
  if (!event.start.dateTime || !event.end.dateTime) return false
  const now = Date.now()
  return new Date(event.start.dateTime).getTime() <= now &&
    new Date(event.end.dateTime).getTime() >= now
}

function isPast(event: CalendarEvent): boolean {
  if (!event.end.dateTime) return false
  return new Date(event.end.dateTime).getTime() < Date.now()
}

export function CalendarEventsList({ events }: CalendarEventsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Dzisiaj w kalendarzu
          <span className="ml-auto text-xs font-normal text-muted-foreground">
            {events.length} {events.length === 1 ? 'wydarzenie' : events.length < 5 ? 'wydarzenia' : 'wydarzeń'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            Brak wydarzeń na dzisiaj.
          </p>
        ) : (
          events.map(event => {
            const ongoing = isOngoing(event)
            const past = isPast(event)
            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 rounded-md border p-3 text-sm transition-colors ${
                  ongoing
                    ? 'border-primary/40 bg-primary/5'
                    : past
                    ? 'opacity-50 bg-muted/30'
                    : 'bg-card'
                }`}
              >
                <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug truncate">{event.summary}</p>
                    {event.htmlLink && (
                      <a
                        href={event.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatEventTime(event)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[200px]">{event.location}</span>
                      </span>
                    )}
                  </div>
                  {ongoing && (
                    <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Trwa teraz
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
