import { getOrganizations } from '@/lib/actions/super-admin'
import { OrganizationsList } from '@/components/super-admin/organizations-list'
import { CreateOrganizationDialog } from '@/components/super-admin/create-organization-dialog'

export default async function OrganizationsPage() {
  const organizations = await getOrganizations()

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground mt-1">
            Manage all organizations on the platform
          </p>
        </div>
        <CreateOrganizationDialog />
      </div>

      <OrganizationsList organizations={organizations} />
    </div>
  )
}
