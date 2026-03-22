import { getMyLeaveRequests } from '@/lib/actions/leave-requests'
import { CreateLeaveRequestDialog } from '@/components/workspace/requests/create-leave-request-dialog'
import { WorkerLeaveRequestsList } from '@/components/workspace/requests/worker-leave-requests-list'
import { redirect } from 'next/navigation'

export default async function WorkerRequestsPage() {
  const requests = await getMyLeaveRequests()

  if (requests === null) redirect('/auth/login')

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wnioski</h1>
          <p className="text-muted-foreground mt-1">
            Twoje wnioski urlopowe i nieobecności
          </p>
        </div>
        <CreateLeaveRequestDialog />
      </div>

      <WorkerLeaveRequestsList requests={requests} />
    </div>
  )
}
