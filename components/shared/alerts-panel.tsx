'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, CheckCircle2, Clock, Mail, ClipboardList, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AlertItem {
  id: string
  message: string
  detail?: string | null
  href: string
  severity: 'warning' | 'error' | 'info'
  icon: 'clock' | 'tasks' | 'mail' | 'approval'
}

interface AlertsPanelProps {
  alerts: AlertItem[]
}

const iconMap = {
  clock: Clock,
  tasks: ClipboardList,
  mail: Mail,
  approval: Bell,
}

const severityStyles = {
  error: {
    row: 'border-l-4 border-destructive bg-destructive/5',
    icon: 'text-destructive',
    text: 'text-destructive',
  },
  warning: {
    row: 'border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20',
    icon: 'text-amber-600 dark:text-amber-400',
    text: 'text-amber-800 dark:text-amber-200',
  },
  info: {
    row: 'border-l-4 border-muted-foreground/30 bg-muted/30',
    icon: 'text-muted-foreground',
    text: 'text-muted-foreground',
  },
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Wymaga uwagi
          {alerts.length > 0 && (
            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[11px] font-bold text-destructive-foreground">
              {alerts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            Brak rzeczy wymagających uwagi
          </div>
        ) : (
          alerts.map(alert => {
            const Icon = iconMap[alert.icon]
            const styles = severityStyles[alert.severity]
            return (
              <Link
                key={alert.id}
                href={alert.href}
                className={cn(
                  'flex items-start gap-3 rounded-md px-3 py-2.5 transition-colors hover:brightness-95',
                  styles.row
                )}
              >
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', styles.icon)} />
                <div className="min-w-0">
                  <p className={cn('text-sm font-medium leading-snug', styles.text)}>
                    {alert.message}
                  </p>
                  {alert.detail && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {alert.detail}
                    </p>
                  )}
                </div>
              </Link>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
