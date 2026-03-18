import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check for admin membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*, organization:organizations(*), profile:profiles(*)')
    .eq('user_id', user.id)
    .eq('role', 'admin')
    .single()

  if (!membership) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar 
        user={{ 
          name: membership.profile?.full_name || membership.profile?.email || 'Admin', 
          email: membership.profile?.email || ''
        }}
        organization={{
          name: membership.organization?.name || 'Organization',
          slug: membership.organization?.slug || ''
        }}
      />
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
