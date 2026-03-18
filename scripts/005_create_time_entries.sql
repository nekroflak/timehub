-- Create time_entries table
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  project_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON public.time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_organization_id ON public.time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON public.time_entries(date);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON public.time_entries(user_id, date);

-- Enable RLS
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Workers can view their own time entries
CREATE POLICY "time_entries_select_own" ON public.time_entries
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Workers can insert their own time entries
CREATE POLICY "time_entries_insert_own" ON public.time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Workers can update their own time entries
CREATE POLICY "time_entries_update_own" ON public.time_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Workers can delete their own time entries
CREATE POLICY "time_entries_delete_own" ON public.time_entries
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Admins can view all time entries in their org
CREATE POLICY "time_entries_select_org_admin" ON public.time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = time_entries.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Policy: Super admins can view all time entries
CREATE POLICY "time_entries_select_super_admin" ON public.time_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );
