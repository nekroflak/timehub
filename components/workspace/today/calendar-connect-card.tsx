'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Link2, Link2Off, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface CalendarConnectCardProps {
  isConnected: boolean
}

export function CalendarConnectCard({ isConnected }: CalendarConnectCardProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleDisconnect() {
    setLoading(true)
    await fetch('/api/calendar/disconnect', { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  if (isConnected) {
    return (
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
        <CardContent className="flex items-center justify-between py-4 px-5">
          <div className="flex items-center gap-3 text-sm">
            <Calendar className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-green-800 dark:text-green-300 font-medium">
              Kalendarz Google połączony
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive gap-1.5"
            onClick={handleDisconnect}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Link2Off className="h-3 w-3" />}
            Odłącz
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Połącz Google Calendar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Połącz swój kalendarz Google, aby widzieć dzisiejsze spotkania i wydarzenia razem z zadaniami.
        </p>
        <a href="/api/calendar/connect">
          <Button size="sm" className="gap-2">
            <Link2 className="h-4 w-4" />
            Połącz z Google Calendar
          </Button>
        </a>
      </CardContent>
    </Card>
  )
}
