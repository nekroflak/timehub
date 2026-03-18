import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminSidebar } from '@/components/super-admin/sidebar'

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Use app_metadata to check super admin - avoids querying profiles table (RLS recursion)
  const isSuperAdmin = user.app_metadata?.is_super_admin === true

  if (!isSuperAdmin) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar user={{ 
        name: user.user_metadata?.full_name || user.email || 'Super Admin',
        email: user.email || '',
      }} />
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
