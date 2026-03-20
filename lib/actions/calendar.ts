'use server'

import { createClient } from '@/lib/supabase/server'

export interface CalendarEvent {
  id: string
  summary: string
  description?: string
  start: { dateTime?: string; date?: string; timeZone?: string }
  end: { dateTime?: string; date?: string; timeZone?: string }
  location?: string
  htmlLink?: string
  colorId?: string
}

async function getValidGoogleAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: tokenRow, error } = await supabase
    .from('user_calendar_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle()

  console.log('[v0] getValidGoogleAccessToken: tokenRow=', tokenRow, 'error=', error)

  if (!tokenRow) return null

  const isExpired = tokenRow.expires_at
    ? new Date(tokenRow.expires_at) <= new Date(Date.now() + 60_000)
    : false

  if (!isExpired) {
    console.log('[v0] token is valid, not expired')
    return tokenRow.access_token
  }

  console.log('[v0] token expired, attempting refresh')

  if (!tokenRow.refresh_token) return null

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    console.log('[v0] token refresh failed:', await res.text())
    return null
  }

  const tokens = await res.json()
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  await supabase.from('user_calendar_tokens').update({
    access_token: tokens.access_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  })
    .eq('user_id', userId)
    .eq('provider', 'google')

  return tokens.access_token
}

export async function getCalendarConnectionStatus(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('user_calendar_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('provider', 'google')
    .maybeSingle()

  return !!data
}

// ----------------------------------------------------------------
// Outlook helpers
// ----------------------------------------------------------------

async function getValidOutlookAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: tokenRow } = await supabase
    .from('user_calendar_tokens')
    .select('access_token, refresh_token, expires_at')
    .eq('user_id', userId)
    .eq('provider', 'outlook')
    .maybeSingle()

  if (!tokenRow) return null

  const isExpired = tokenRow.expires_at
    ? new Date(tokenRow.expires_at) <= new Date(Date.now() + 60_000)
    : false

  if (!isExpired) return tokenRow.access_token

  if (!tokenRow.refresh_token) return null

  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: tokenRow.refresh_token,
      grant_type: 'refresh_token',
      scope: 'Calendars.Read offline_access',
    }),
  })

  if (!res.ok) return null

  const tokens = await res.json()
  const expiresAt = tokens.expires_in
    ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
    : null

  await supabase.from('user_calendar_tokens').update({
    access_token: tokens.access_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  })
    .eq('user_id', userId)
    .eq('provider', 'outlook')

  return tokens.access_token
}

export async function getOutlookConnectionStatus(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from('user_calendar_tokens')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('provider', 'outlook')
    .maybeSingle()

  return !!data
}

export async function getTodayOutlookEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const accessToken = await getValidOutlookAccessToken(user.id)
  if (!accessToken) return []

  const now = new Date()
  const startOfDay = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0
  ))
  const endOfDay = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59
  ))

  const params = new URLSearchParams({
    startDateTime: startOfDay.toISOString(),
    endDateTime: endOfDay.toISOString(),
    $orderby: 'start/dateTime',
    $top: '50',
    $select: 'id,subject,bodyPreview,start,end,location,webLink',
  })

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarView?${params}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    }
  )

  if (!res.ok) return []

  const data = await res.json()

  // Normalize Microsoft Graph events to the shared CalendarEvent shape
  return (data.value ?? []).map((e: {
    id: string
    subject?: string
    bodyPreview?: string
    start?: { dateTime?: string; timeZone?: string }
    end?: { dateTime?: string; timeZone?: string }
    location?: { displayName?: string }
    webLink?: string
  }): CalendarEvent => ({
    id: e.id,
    summary: e.subject ?? '(bez tytułu)',
    description: e.bodyPreview,
    start: { dateTime: e.start?.dateTime, timeZone: e.start?.timeZone },
    end: { dateTime: e.end?.dateTime, timeZone: e.end?.timeZone },
    location: e.location?.displayName,
    htmlLink: e.webLink,
  }))
}

export async function getTodayCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const accessToken = await getValidGoogleAccessToken(user.id)
  if (!accessToken) {
    console.log('[v0] getTodayCalendarEvents: no access token available')
    return []
  }

  // Use a wide window: start of today UTC-12 to end of today UTC+14
  // This ensures all-day events and any timezone's "today" events are captured.
  // We use a full 24h UTC window centred on today, then let the component
  // display only events that belong to the user's date.
  const now = new Date()
  // Start: midnight of today in the most-behind timezone (UTC-12)
  const startOfDay = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0
  ))
  // End: 23:59:59 of today in the most-ahead timezone (UTC+14)
  const endOfDay = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    23, 59, 59
  ))

  const timeMin = startOfDay.toISOString()
  const timeMax = endOfDay.toISOString()

  console.log('[v0] getTodayCalendarEvents: timeMin=', timeMin, 'timeMax=', timeMax)

  const params = new URLSearchParams({
    calendarId: 'primary',
    timeMin,
    timeMax,
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '50',
  })

  const apiUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`
  console.log('[v0] Google Calendar API URL:', apiUrl)

  const res = await fetch(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })

  if (!res.ok) {
    const errText = await res.text()
    console.log('[v0] Google Calendar API error:', res.status, errText)
    return []
  }

  const data = await res.json()
  console.log('[v0] Google Calendar API response: items count=', data.items?.length ?? 0, 'summary=', data.summary)

  return (data.items ?? []) as CalendarEvent[]
}
