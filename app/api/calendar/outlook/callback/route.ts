import { createServiceClient } from '@/lib/supabase/service'
import { NextRequest, NextResponse } from 'next/server'

interface OutlookState {
  userId: string
  provider: string
  returnPath: string
}

function parseState(raw: string | null): { ok: true; data: OutlookState } | { ok: false; reason: string } {
  if (!raw) return { ok: false, reason: 'state param missing' }
  try {
    const decoded = Buffer.from(raw, 'base64url').toString('utf-8')
    const parsed = JSON.parse(decoded)
    if (
      typeof parsed.userId === 'string' &&
      typeof parsed.provider === 'string' &&
      typeof parsed.returnPath === 'string'
    ) {
      return { ok: true, data: parsed as OutlookState }
    }
    return { ok: false, reason: `state fields invalid: ${JSON.stringify(parsed)}` }
  } catch (e) {
    return { ok: false, reason: `state parse exception: ${String(e)}` }
  }
}

function debugResponse(info: Record<string, unknown>): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>Outlook Callback Debug</title>
<style>
  body { font-family: monospace; background: #0f0f0f; color: #e0e0e0; padding: 2rem; }
  h1 { color: #f87171; }
  table { border-collapse: collapse; width: 100%; margin-top: 1rem; }
  td, th { border: 1px solid #333; padding: 0.5rem 1rem; text-align: left; }
  th { color: #94a3b8; background: #1e1e1e; }
  .ok { color: #4ade80; }
  .fail { color: #f87171; }
  pre { background: #1e1e1e; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
</style>
</head>
<body>
<h1>Outlook OAuth Callback — Debug Output</h1>
<table>
<tr><th>Step</th><th>Value</th></tr>
${Object.entries(info)
  .map(([k, v]) => {
    const val = typeof v === 'boolean'
      ? `<span class="${v ? 'ok' : 'fail'}">${v}</span>`
      : typeof v === 'object' && v !== null
        ? `<pre>${JSON.stringify(v, null, 2)}</pre>`
        : `<code>${String(v ?? 'null')}</code>`
    return `<tr><td>${k}</td><td>${val}</td></tr>`
  })
  .join('\n')}
</table>
</body>
</html>`
  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
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

  console.log('[v0] Outlook callback reached')
  console.log('[v0] code present:', !!code)
  console.log('[v0] rawState:', rawState)
  console.log('[v0] ms_error:', msError, msErrorDesc)

  // Step 1 — Microsoft returned an error
  if (msError || !code) {
    return debugResponse({
      step: 'microsoft_authorization',
      code_present: !!code,
      state_present: !!rawState,
      ms_error: msError ?? null,
      ms_error_description: msErrorDesc ?? null,
      failure: 'Microsoft did not return a code — check Azure app permissions or redirect URI registration',
    })
  }

  // Step 2 — Parse state
  const stateResult = parseState(rawState)
  console.log('[v0] state parse result:', stateResult)

  if (!stateResult.ok) {
    return debugResponse({
      step: 'state_parsing',
      code_present: true,
      state_present: !!rawState,
      raw_state: rawState,
      parse_error: stateResult.reason,
      failure: 'State parameter could not be decoded — may indicate the connect route did not encode it correctly',
    })
  }

  const { userId, provider } = stateResult.data

  if (provider !== 'outlook') {
    return debugResponse({
      step: 'state_validation',
      code_present: true,
      state_parsed: true,
      resolved_user_id: userId,
      provider_in_state: provider,
      expected_provider: 'outlook',
      failure: 'Provider mismatch in state',
    })
  }

  // Step 3 — Token exchange
  const tokenPayload = new URLSearchParams({
    code,
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
    scope: 'Calendars.Read offline_access openid profile',
  })

  console.log('[v0] token exchange redirect_uri:', redirectUri)

  const tokenRes = await fetch(
    'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenPayload,
    }
  )

  const tokenBody = await tokenRes.text()
  console.log('[v0] token exchange status:', tokenRes.status)
  console.log('[v0] token exchange body:', tokenBody)

  if (!tokenRes.ok) {
    let parsedError: unknown = tokenBody
    try { parsedError = JSON.parse(tokenBody) } catch { /* keep raw */ }

    return debugResponse({
      step: 'token_exchange',
      code_present: true,
      state_parsed: true,
      resolved_user_id: userId,
      provider: 'outlook',
      redirect_uri_used: redirectUri,
      token_exchange_http_status: tokenRes.status,
      token_exchange_error: parsedError,
      failure: 'Microsoft token exchange failed — see token_exchange_error for the reason',
    })
  }

  let tokens: Record<string, unknown>
  try {
    tokens = JSON.parse(tokenBody)
  } catch (e) {
    return debugResponse({
      step: 'token_parse',
      code_present: true,
      state_parsed: true,
      resolved_user_id: userId,
      provider: 'outlook',
      token_exchange_http_status: tokenRes.status,
      raw_token_body: tokenBody,
      failure: `Token response was not valid JSON: ${String(e)}`,
    })
  }

  const hasAccessToken = !!tokens.access_token
  const hasRefreshToken = !!tokens.refresh_token
  const expiresAt = typeof tokens.expires_in === 'number'
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  console.log('[v0] tokens — access_token present:', hasAccessToken, '| refresh_token present:', hasRefreshToken)

  // Step 4 — DB upsert
  const serviceSupabase = createServiceClient()

  const upsertPayload = {
    user_id: userId,
    provider: 'outlook',
    access_token: tokens.access_token as string,
    refresh_token: (tokens.refresh_token as string | undefined) ?? null,
    expires_at: expiresAt,
    scope: (tokens.scope as string | undefined) ?? null,
    updated_at: new Date().toISOString(),
  }

  console.log('[v0] upsert payload user_id:', userId, 'provider: outlook')

  const { error: upsertError } = await serviceSupabase
    .from('user_calendar_tokens')
    .upsert(upsertPayload, { onConflict: 'user_id,provider' })

  if (upsertError) {
    console.log('[v0] upsert FAILED:', upsertError.message, upsertError.details, upsertError.hint)
    return debugResponse({
      step: 'db_upsert',
      code_present: true,
      state_parsed: true,
      resolved_user_id: userId,
      provider: 'outlook',
      token_exchange_success: true,
      access_token_present: hasAccessToken,
      refresh_token_present: hasRefreshToken,
      db_upsert_attempted: true,
      db_error_message: upsertError.message,
      db_error_details: upsertError.details ?? null,
      db_error_hint: upsertError.hint ?? null,
      db_error_code: upsertError.code ?? null,
      failure: 'DB upsert failed — see db_error_* fields for the exact cause',
    })
  }

  console.log('[v0] upsert SUCCESS for user:', userId)

  // All steps succeeded — redirect normally
  return NextResponse.redirect(`${redirectBase}?calendar_connected=outlook`)
}
