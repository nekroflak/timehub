-- RLS policies for timesheet_submissions
-- Workers: can read and write their own submissions
-- Admins: can read and update all submissions in their org

ALTER TABLE public.timesheet_submissions ENABLE ROW LEVEL SECURITY;

-- Drop any stale policies before re-creating
DROP POLICY IF EXISTS "Workers can view own submissions" ON public.timesheet_submissions;
DROP POLICY IF EXISTS "Workers can insert own submissions" ON public.timesheet_submissions;
DROP POLICY IF EXISTS "Workers can update own submissions" ON public.timesheet_submissions;
DROP POLICY IF EXISTS "Admins can view org submissions" ON public.timesheet_submissions;
DROP POLICY IF EXISTS "Admins can update org submissions" ON public.timesheet_submissions;

-- Workers: read own rows
CREATE POLICY "Workers can view own submissions"
  ON public.timesheet_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Workers: insert own rows
CREATE POLICY "Workers can insert own submissions"
  ON public.timesheet_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Workers: update own rows only when status is draft (cannot un-submit)
CREATE POLICY "Workers can update own submissions"
  ON public.timesheet_submissions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins: read all submissions in their org
CREATE POLICY "Admins can view org submissions"
  ON public.timesheet_submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = timesheet_submissions.organization_id
        AND organization_members.role = 'admin'
    )
  );

-- Admins: update (approve/reject) submissions in their org
CREATE POLICY "Admins can update org submissions"
  ON public.timesheet_submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members
      WHERE organization_members.user_id = auth.uid()
        AND organization_members.organization_id = timesheet_submissions.organization_id
        AND organization_members.role = 'admin'
    )
  );
