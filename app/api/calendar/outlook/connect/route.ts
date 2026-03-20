import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const SCOPES = [
  'Calendars.Read',
  'offline_access',
  'openid',
  'profile',
].join(' ')

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!))

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/calendar/outlook/callback`,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state: user.id,
  })

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  )
}
