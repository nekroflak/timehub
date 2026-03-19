import { getInvitations, getOrganizations } from '@/lib/actions/super-admin'
import { InvitationsList } from '@/components/super-admin/invitations-list'
import { CreateInvitationDialog } from '@/components/super-admin/create-invitation-dialog'

export default async function InvitationsPage() {
  const [invitations, organizations] = await Promise.all([
    getInvitations(),
    getOrganizations(),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Zaproszenia</h1>
          <p className="text-muted-foreground mt-1">
            Zarządzaj zaproszeniami na platformie
          </p>
        </div>
        <CreateInvitationDialog organizations={organizations} />
      </div>

      <InvitationsList invitations={invitations} />
    </div>
  )
}
