import { getTeamMembers, getOrgInvitations } from '@/lib/actions/admin'
import { TeamMembersList } from '@/components/admin/team-members-list'
import { InviteTeamMemberDialog } from '@/components/admin/invite-team-member-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OrgInvitationsList } from '@/components/admin/org-invitations-list'

export default async function TeamPage() {
  const [members, invitations] = await Promise.all([
    getTeamMembers(),
    getOrgInvitations(),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your team members and invitations
          </p>
        </div>
        <InviteTeamMemberDialog />
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invitations">Pending ({invitations.filter(i => !i.accepted_at).length})</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-6">
          <TeamMembersList members={members} />
        </TabsContent>
        <TabsContent value="invitations" className="mt-6">
          <OrgInvitationsList invitations={invitations} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
