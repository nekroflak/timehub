import { getOrgLeaveRequests } from '@/lib/actions/leave-requests'
import { getTeamMembers } from '@/lib/actions/admin'
import { AdminLeaveRequestsTable } from '@/components/admin/leave-requests-table'
import { redirect } from 'next/navigation'

export default async function AdminRequestsPage() {
  const [requests, members] = await Promise.all([
    getOrgLeaveRequests(),
    getTeamMembers(),
  ])

  if (!requests) redirect('/auth/login')

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Wnioski</h1>
        <p className="text-muted-foreground mt-1">
          Wnioski urlopowe i nieobecności pracowników
        </p>
      </div>

      <AdminLeaveRequestsTable requests={requests} members={members} />
    </div>
  )
}
