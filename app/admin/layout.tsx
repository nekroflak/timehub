import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('organization_id, organization:organizations(name, slug), profile:profiles(full_name, email)')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!membership) redirect('/')

  const org = membership.organization as any
  const profile = membership.profile as any

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        user={{
          name: profile?.full_name || profile?.email || 'Admin',
          email: profile?.email || user.email || '',
        }}
        organization={{
          name: org?.name || 'Organization',
          slug: org?.slug || '',
        }}
      />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  )
}
