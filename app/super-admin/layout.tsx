import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SuperAdminSidebar } from '@/components/super-admin/sidebar'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role, full_name, email')
    .eq('id', user.id)
    .single()

  if (profile?.platform_role !== 'super_admin') {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <SuperAdminSidebar
        user={{
          name: profile.full_name || profile.email || 'Super Admin',
          email: profile.email || user.email || '',
        }}
      />
      <main className="flex-1 bg-muted/30">{children}</main>
    </div>
  )
}
