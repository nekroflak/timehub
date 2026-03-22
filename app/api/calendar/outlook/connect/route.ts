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
  if (!user) {
    return NextResponse.redirect(
      new URL('/auth/login', process.env.NEXT_PUBLIC_APP_URL!)
    )
  }

  // Normalize base URL — strip trailing slash to avoid redirect_uri mismatch
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/calendar/outlook/callback`

  // Encode state as base64 JSON so the callback can safely resolve the user
  // even when no session cookie is present in the redirect
  const statePayload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      provider: 'outlook',
      returnPath: '/workspace/today',
    })
  ).toString('base64url')

  console.log('[v0] Outlook connect — redirect_uri:', redirectUri)
  console.log('[v0] Outlook connect — state userId:', user.id)

  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES,
    response_mode: 'query',
    state: statePayload,
  })

  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`
  )
}
