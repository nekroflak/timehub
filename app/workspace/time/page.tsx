import { getTimePageData } from '@/lib/actions/worker'
import { WorkspaceTimeClient } from '@/components/workspace/workspace-time-client'
import { redirect } from 'next/navigation'

export default async function TimeTrackingPage() {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const data = await getTimePageData(currentMonth)

  if (!data) redirect('/auth/login')

  return (
    <div className="p-8">
      <WorkspaceTimeClient
        orgName={data.organizationName}
        workerName={data.profile?.full_name ?? ''}
        workerEmail={data.profile?.email ?? data.userEmail}
        initialMonth={currentMonth}
        initialEntries={data.entries}
        initialSummary={data.summary}
        initialSubmission={data.submission}
        config={{
          hours_per_day: data.config.hours_per_day,
          hourly_rate: data.config.hourly_rate,
          overtime_multiplier: data.config.overtime_multiplier,
          currency: data.config.currency,
        }}
      />
    </div>
  )
}
