import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Button } from '@/components/ui/button'
import { Building2, Mail } from 'lucide-react'

export default async function NoOrgPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: membership } = await supabase
    .from('organization_members')
    .select('role')
    .eq('user_id', user.id)
    .single()

  if (membership?.role === 'admin') redirect('/admin')
  if (membership?.role === 'worker') redirect('/workspace')

  const { data: profile } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .single()

  if (profile?.platform_role === 'super_admin') redirect('/super-admin')

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">Brak przypisanej organizacji</h1>
          <p className="text-muted-foreground">
            Twoje konto istnieje, ale nie zostałeś jeszcze przypisany do żadnej organizacji.
            Poczekaj na zaproszenie od administratora swojej firmy.
          </p>
        </div>

        <div className="rounded-lg border bg-card p-4 text-left space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Zalogowany jako <strong className="text-foreground">{user.email}</strong></span>
          </div>
        </div>

        <form action={signOut}>
          <Button type="submit" variant="outline" className="w-full">
            Wyloguj się
          </Button>
        </form>
      </div>
    </div>
  )
}
