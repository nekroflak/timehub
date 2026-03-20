'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Link2, Link2Off, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CalendarConnectCardProps {
  isGoogleConnected: boolean
  isOutlookConnected: boolean
}

export function CalendarConnectCard({ isGoogleConnected, isOutlookConnected }: CalendarConnectCardProps) {
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingOutlook, setLoadingOutlook] = useState(false)
  const router = useRouter()

  async function handleDisconnectGoogle() {
    setLoadingGoogle(true)
    await fetch('/api/calendar/disconnect', { method: 'DELETE' })
    router.refresh()
    setLoadingGoogle(false)
  }

  async function handleDisconnectOutlook() {
    setLoadingOutlook(true)
    await fetch('/api/calendar/outlook/disconnect', { method: 'DELETE' })
    router.refresh()
    setLoadingOutlook(false)
  }

  const noneConnected = !isGoogleConnected && !isOutlookConnected

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Kalendarze
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Google Calendar row */}
        {isGoogleConnected ? (
          <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-green-600 shrink-0" />
              <span className="text-green-800 dark:text-green-300 font-medium">Google Calendar połączony</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-1.5 h-7"
              onClick={handleDisconnectGoogle}
              disabled={loadingGoogle}
            >
              {loadingGoogle ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
              Odłącz
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Google Calendar</span>
            <a href="/api/calendar/connect">
              <Button size="sm" variant="outline" className="gap-1.5 h-7">
                <Link2 className="h-3 w-3" />
                Połącz
              </Button>
            </a>
          </div>
        )}

        {/* Outlook Calendar row */}
        {isOutlookConnected ? (
          <div className="flex items-center justify-between rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 px-4 py-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
              <span className="text-blue-800 dark:text-blue-300 font-medium">Outlook Calendar połączony</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive gap-1.5 h-7"
              onClick={handleDisconnectOutlook}
              disabled={loadingOutlook}
            >
              {loadingOutlook ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
              Odłącz
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-md border px-4 py-2.5">
            <span className="text-sm text-muted-foreground">Outlook Calendar</span>
            <a href="/api/calendar/outlook/connect">
              <Button size="sm" variant="outline" className="gap-1.5 h-7">
                <Link2 className="h-3 w-3" />
                Połącz
              </Button>
            </a>
          </div>
        )}

        {noneConnected && (
          <p className="text-xs text-muted-foreground pt-1">
            Połącz kalendarz, aby widzieć dzisiejsze spotkania razem z zadaniami.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
