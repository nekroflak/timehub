import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WorkspaceSidebar } from '@/components/workspace/sidebar'

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get membership
  const { data: membership } = await supabase
    .from('memberships')
    .select('*, organization:organizations(*), profile:profiles(*)')
    .eq('user_id', user.id)
    .single()

  if (!membership) {
    // User has no membership - show onboarding or redirect
    redirect('/')
  }

  return (
    <div className="flex min-h-screen">
      <WorkspaceSidebar 
        user={{ 
          name: membership.profile?.full_name || membership.profile?.email || 'User', 
          email: membership.profile?.email || ''
        }}
        organization={{
          name: membership.organization?.name || 'Organization',
        }}
      />
      <main className="flex-1 bg-muted/30">
        {children}
      </main>
    </div>
  )
}
