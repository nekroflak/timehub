import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { resolvePendingInvitations } from '@/lib/actions/auth'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Ensure profile exists
        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || null,
            platform_role: user.email === 'kamilurbanmail@gmail.com' ? 'super_admin' : 'user',
          }, { onConflict: 'id' })

        // Resolve pending invitations
        await resolvePendingInvitations(user.id, user.email!)

        const { data: profile } = await supabase
          .from('profiles')
          .select('platform_role')
          .eq('id', user.id)
          .single()

        if (profile?.platform_role === 'super_admin') {
          return NextResponse.redirect(`${origin}/super-admin`)
        }

        const { data: membership } = await supabase
          .from('organization_members')
          .select('role')
          .eq('user_id', user.id)
          .single()

        if (membership?.role === 'admin') return NextResponse.redirect(`${origin}/admin`)
        if (membership?.role === 'worker') return NextResponse.redirect(`${origin}/workspace`)

        return NextResponse.redirect(`${origin}/no-org`)
      }
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
