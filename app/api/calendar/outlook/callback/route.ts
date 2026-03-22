import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

interface OutlookState {
  userId: string
  provider: string
  returnPath: string
}

function parseState(raw: string | null): OutlookState | null {
  if (!raw) return null
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf-8')
    const parsed = JSON.parse(decoded)
    if (
      typeof parsed.userId === 'string' &&
      typeof parsed.provider === 'string' &&
      typeof parsed.returnPath === 'string'
    ) {
      return parsed as OutlookState
    }
    return null
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const rawState = searchParams.get('state')
  const msError = searchParams.get('error')
  const msErrorDesc = searchParams.get('error_description')

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? '').replace(/\/$/, '')
  const redirectUri = `${appUrl}/api/calendar/outlook/callback`
  const redirectBase = `${appUrl}/workspace/today`

  console.log('[v0] Outlook callback — reached')
  console.log('[v0] Outlook callback — code present:', !!code)
  console.log('[v0] Outlook callback — raw state:', rawState)
  console.log('[v0] Outlook callback — ms error:', msError, msErrorDesc)

  if (msError || !code) {
    console.log('[v0] Outlook callback — aborting: MS error or missing code')
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook`)
  }

  // Decode and validate state
  const state = parseState(rawState)
  console.log('[v0] Outlook callback — parsed userId from state:', state?.userId ?? 'INVALID')

  if (!state || !state.userId || state.provider !== 'outlook') {
    console.log('[v0] Outlook callback — aborting: invalid or missing state')
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook_state`)
  }

  // Exchange code for tokens
  const tokenPayload = new URLSearchParams({
    code,
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: 'Calendars.Read offline_access openid profile',
  })

  const tokenRes = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenPayload,
    }
  )

  if (!tokenRes.ok) {
    const errBody = await tokenRes.text()
    console.log('[v0] Outlook callback — token exchange FAILED:', tokenRes.status, errBody)
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook_token`)
  }

  const tokens = await tokenRes.json()
  console.log('[v0] Outlook callback — token exchange SUCCESS, has refresh_token:', !!tokens.refresh_token)

  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  // Use service client to bypass RLS — callback has no auth cookie session
  const serviceSupabase = createServiceClient()

  const { error: upsertError } = await serviceSupabase
    .from('user_calendar_tokens')
    .upsert(
      {
        user_id: state.userId,
        provider: 'outlook',
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        expires_at: expiresAt,
        scope: tokens.scope ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,provider' }
    )

  if (upsertError) {
    console.log('[v0] Outlook callback — DB upsert FAILED:', upsertError.message, upsertError.details, upsertError.hint)
    return NextResponse.redirect(`${redirectBase}?calendar_error=outlook_db`)
  }

  console.log('[v0] Outlook callback — upsert SUCCESS for user:', state.userId)
  return NextResponse.redirect(`${redirectBase}?calendar_connected=outlook`)
}
