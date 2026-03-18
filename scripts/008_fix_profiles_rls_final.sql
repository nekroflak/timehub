-- Nuclear fix: disable RLS on profiles entirely and drop ALL policies
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT polname FROM pg_policy WHERE polrelid = 'public.profiles'::regclass
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol.polname);
    RAISE NOTICE 'Dropped policy: %', pol.polname;
  END LOOP;
END $$;

-- Confirm
SELECT relrowsecurity AS rls_enabled FROM pg_class
WHERE relname = 'profiles' AND relnamespace = 'public'::regnamespace;
