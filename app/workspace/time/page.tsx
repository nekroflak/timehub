import { getMyTimeEntries, getMonthlySummary, getUserConfig, getWorkerStats } from '@/lib/actions/worker'
import { WorkspaceTimeClient } from '@/components/workspace/workspace-time-client'
import { createClient } from '@/lib/supabase/server'

export default async function TimeTrackingPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [entries, summary, config, stats] = await Promise.all([
    getMyTimeEntries(currentMonth),
    getMonthlySummary(currentMonth),
    getUserConfig(),
    getWorkerStats(),
  ])

  const { data: profile } = user
    ? await supabase.from('profiles').select('full_name, email').eq('id', user.id).single()
    : { data: null }

  const pdfConfig = {
    hours_per_day: config?.hours_per_day ?? 8,
    hourly_rate: config?.hourly_rate ?? 50,
    overtime_multiplier: config?.overtime_multiplier ?? 1.5,
    currency: config?.currency ?? 'PLN',
  }

  return (
    <div className="p-8">
      <WorkspaceTimeClient
        orgName={stats?.organizationName ?? 'Organizacja'}
        workerName={profile?.full_name ?? ''}
        workerEmail={profile?.email ?? user?.email ?? ''}
        initialMonth={currentMonth}
        initialEntries={entries}
        initialSummary={summary}
        config={pdfConfig}
      />
    </div>
  )
}
