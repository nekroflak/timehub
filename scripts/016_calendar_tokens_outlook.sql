-- Extend user_calendar_tokens to support Outlook provider.
-- The table already has UNIQUE(user_id, provider) so multi-provider rows work fine.
-- We only need to widen the CHECK constraint to allow 'outlook'.

ALTER TABLE public.user_calendar_tokens
  DROP CONSTRAINT IF EXISTS user_calendar_tokens_provider_check;

ALTER TABLE public.user_calendar_tokens
  ADD CONSTRAINT user_calendar_tokens_provider_check
  CHECK (provider IN ('google', 'outlook'));

-- Also fix any existing Google rows that were upserted without a provider value
-- (the original callback did not set provider explicitly).
UPDATE public.user_calendar_tokens
  SET provider = 'google'
  WHERE provider IS NULL OR provider = '';
