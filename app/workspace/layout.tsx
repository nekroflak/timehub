import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('*, organization:organizations(*), profile:profiles(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect('/no-org')

  const org = membership.organization as any
  const profile = membership.profile as any

  return (
    <div className="flex min-h-screen">
      <WorkspaceSidebar
        user={{
          name: profile?.full_name || profile?.email || 'User',
          email: profile?.email || user.email || '',
        }}
        organization={{
          name: org?.name || 'Organization',
        }}
      />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  )
}
