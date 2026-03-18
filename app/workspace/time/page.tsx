import { getMyTimeEntries, getMonthlySummary, getUserConfig, getWorkerStats } from '@/lib/actions/worker'
import { TimeTrackingCalendar } from '@/components/workspace/time-tracking-calendar'
import { DownloadPdfButton } from '@/components/workspace/download-pdf-button'
import { createClient } from '@/lib/supabase/server'

export default async function TimeTrackingPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [entries, summary, config, stats] = await Promise.all([
    getMyTimeEntries(),
    getMonthlySummary(),
    getUserConfig(),
    getWorkerStats(),
  ])

  // Fetch profile for name
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
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Czas pracy</h1>
          <p className="text-muted-foreground mt-1">
            Rejestruj godziny pracy i urlopy
          </p>
        </div>
        <DownloadPdfButton
          orgName={stats?.organizationName ?? 'Organizacja'}
          workerName={profile?.full_name ?? ''}
          workerEmail={profile?.email ?? user?.email ?? ''}
          month={currentMonth}
          entries={entries}
          config={pdfConfig}
        />
      </div>

      <TimeTrackingCalendar initialEntries={entries} summary={summary} />
    </div>
  )
}
