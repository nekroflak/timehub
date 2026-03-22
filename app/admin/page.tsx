import { getAdminStats, getAdminAlerts } from '@/lib/actions/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Clock, Mail } from 'lucide-react'
import { redirect } from 'next/navigation'
import { AlertsPanel } from '@/components/shared/alerts-panel'
import type { AlertItem } from '@/components/shared/alerts-panel'

export default async function AdminDashboard() {
  const [stats, alerts] = await Promise.all([
    getAdminStats(),
    getAdminAlerts(),
  ])

  if (!stats) {
    redirect('/auth/login')
  }

  const alertItems: AlertItem[] = []

  if (alerts) {
    if (alerts.pendingApprovals > 0) {
      alertItems.push({
        id: 'approvals',
        message: alerts.pendingApprovals === 1
          ? '1 miesiąc czeka na akceptację'
          : `${alerts.pendingApprovals} miesiące czekają na akceptację`,
        href: '/admin/approvals',
        severity: 'warning',
        icon: 'approval',
      })
    }
    if (alerts.overdueTasksCount > 0) {
      alertItems.push({
        id: 'overdue-tasks',
        message: alerts.overdueTasksCount === 1
          ? '1 zadanie jest przypisane od ponad 48 godzin'
          : `${alerts.overdueTasksCount} zadania są przypisane od ponad 48 godzin`,
        href: '/admin/approvals',
        severity: 'warning',
        icon: 'tasks',
      })
    }
    if (alerts.pendingInvitations > 0) {
      alertItems.push({
        id: 'invitations',
        message: alerts.pendingInvitations === 1
          ? '1 zaproszenie oczekuje na akceptację'
          : `${alerts.pendingInvitations} zaproszenia oczekują na akceptację`,
        href: '/admin/team',
        severity: 'info',
        icon: 'mail',
      })
    }
    if (alerts.pendingLeaveRequests > 0) {
      alertItems.push({
        id: 'leave-requests',
        message: alerts.pendingLeaveRequests === 1
          ? '1 wniosek urlopowy czeka na rozpatrzenie'
          : `${alerts.pendingLeaveRequests} wnioski urlopowe czekają na rozpatrzenie`,
        href: '/admin/requests',
        severity: 'warning',
        icon: 'approval',
      })
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{stats.organizationName}</h1>
        <p className="text-muted-foreground mt-1">
          Przegląd panelu organizacji
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Członkowie zespołu
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Godziny w tym miesiącu
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.hoursThisMonth.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Oczekujące zaproszenia
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingInvitations}</div>
          </CardContent>
        </Card>
      </div>

      <AlertsPanel alerts={alertItems} />
    </div>
  )
}
