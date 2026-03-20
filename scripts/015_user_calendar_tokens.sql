-- User calendar tokens table (isolated, private per user)
-- Stores OAuth tokens for Google Calendar read-only integration.
-- Admin can NEVER read another user's tokens (enforced by RLS).

CREATE TABLE IF NOT EXISTS public.user_calendar_tokens (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider      text NOT NULL CHECK (provider IN ('google')),
  access_token  text NOT NULL,
  refresh_token text,
  expires_at    timestamptz,
  scope         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE (user_id, provider)
);

-- Enable RLS
ALTER TABLE public.user_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Only the token owner can read/write their own tokens
CREATE POLICY "user_calendar_tokens_owner_select" ON public.user_calendar_tokens
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_calendar_tokens_owner_insert" ON public.user_calendar_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_calendar_tokens_owner_update" ON public.user_calendar_tokens
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_calendar_tokens_owner_delete" ON public.user_calendar_tokens
  FOR DELETE USING (auth.uid() = user_id);
