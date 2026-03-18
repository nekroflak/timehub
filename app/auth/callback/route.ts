import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get user to determine redirect
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_super_admin')
          .eq('id', user.id)
          .single()

        if (profile?.is_super_admin) {
          return NextResponse.redirect(`${origin}/super-admin`)
        }

        const { data: memberships } = await supabase
          .from('memberships')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)

        if (memberships && memberships.length > 0) {
          const role = memberships[0].role
          if (role === 'admin') {
            return NextResponse.redirect(`${origin}/admin`)
          }
          return NextResponse.redirect(`${origin}/workspace`)
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
