-- Add foreign key from timesheet_submissions.user_id -> profiles.id
-- so Supabase PostgREST can resolve the profile relation join
ALTER TABLE public.timesheet_submissions
  ADD CONSTRAINT timesheet_submissions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Also add FK for organization_id consistency
ALTER TABLE public.timesheet_submissions
  ADD CONSTRAINT timesheet_submissions_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
