import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const userId = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const redirectBase = `${appUrl}/workspace/today`

  if (error || !code || !userId) {
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook`)
  }

  // Exchange code for tokens via Microsoft identity platform
  const tokenRes = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.MICROSOFT_CLIENT_ID!,
        client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
        redirect_uri: `${appUrl}/api/calendar/outlook/callback`,
        grant_type: 'authorization_code',
        scope: 'Calendars.Read offline_access openid profile',
      }),
    }
  )

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook`)
  }

  const tokens = await tokenRes.json()

  // Verify session user matches state param
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook`)
  }

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  await supabase.from('user_calendar_tokens').upsert({
    user_id: user.id,
    provider: 'outlook',
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token ?? null,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,provider' })

  return NextResponse.redirect(`${redirectBase}?calendar_connected=outlook`)
}
