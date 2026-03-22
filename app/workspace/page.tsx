import { getWorkerStats, getWorkerAlerts } from '@/lib/actions/worker'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, FileText } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AlertsPanel } from '@/components/shared/alerts-panel'
import type { AlertItem } from '@/components/shared/alerts-panel'

export default async function WorkspaceDashboard() {
  const [stats, alerts] = await Promise.all([
    getWorkerStats(),
    getWorkerAlerts(),
  ])

  if (!stats) {
    redirect('/auth/login')
  }

  const alertItems: AlertItem[] = []

  if (alerts) {
    if (alerts.submissionStatus === 'rejected') {
      alertItems.push({
        id: 'rejected',
        message: 'Twój miesiąc został odrzucony',
        detail: alerts.rejectionComment ?? 'Sprawdź komentarz administratora w ewidencji czasu.',
        href: '/workspace/time',
        severity: 'error',
        icon: 'approval',
      })
    } else if (!alerts.submissionStatus || alerts.submissionStatus === 'draft') {
      alertItems.push({
        id: 'not-submitted',
        message: 'Bieżący miesiąc nie został jeszcze wysłany do akceptacji',
        href: '/workspace/time',
        severity: 'info',
        icon: 'clock',
      })
    }

    if (alerts.overdueTasksCount > 0) {
      alertItems.push({
        id: 'overdue-tasks',
        message: alerts.overdueTasksCount === 1
          ? 'Masz 1 zadanie przypisane od ponad 48 godzin'
          : `Masz ${alerts.overdueTasksCount} zadania przypisane od ponad 48 godzin`,
        href: '/workspace/board',
        severity: 'warning',
        icon: 'tasks',
      })
    }
    if (alerts.rejectedLeaveRequests > 0) {
      alertItems.push({
        id: 'rejected-leave',
        message: alerts.rejectedLeaveRequests === 1
          ? 'Twój wniosek został odrzucony'
          : `${alerts.rejectedLeaveRequests} Twoich wniosków zostało odrzuconych`,
        detail: 'Sprawdź komentarz administratora w sekcji Wnioski.',
        href: '/workspace/requests',
        severity: 'error',
        icon: 'approval',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Witaj ponownie</h1>
        <p className="text-muted-foreground mt-1">
          Twoje miejsce pracy w {stats.organizationName}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Godziny w tym miesiącu
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hoursThisMonth.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Notatki osobiste
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalNotes}</div>
          </CardContent>
        </Card>
      </div>

      <AlertsPanel alerts={alertItems} />
    </div>
  )
}
