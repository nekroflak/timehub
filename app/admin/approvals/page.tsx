import { getOrgSubmissions, getOrgMembers } from '@/lib/actions/approvals'
import { ApprovalsList } from '@/components/admin/approvals-list'
import { CheckSquare } from 'lucide-react'

export default async function ApprovalsPage() {
  const [submissions, members] = await Promise.all([
    getOrgSubmissions(),
    getOrgMembers(),
  ])

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <CheckSquare className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Zatwierdzenia</h1>
            <p className="text-muted-foreground mt-1">
              Przeglądaj i zatwierdzaj miesięczne arkusze czasu pracy
            </p>
          </div>
        </div>
      </div>

      <ApprovalsList submissions={submissions} members={members} />
    </div>
  )
}
