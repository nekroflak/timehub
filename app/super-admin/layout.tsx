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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_super_admin, full_name, email')
    .eq('id', user.id)
    .single()

  console.log('[v0] Super admin layout - profile query:', { profile, error: profileError?.message })

  if (!profile?.is_super_admin) {
    console.log('[v0] Super admin layout - not super admin, redirecting to /')
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar user={{ 
        name: profile.full_name || profile.email, 
        email: profile.email 
      }} />
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
