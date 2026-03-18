-- Create membership role enum
DO $$ BEGIN
  CREATE TYPE membership_role AS ENUM ('admin', 'worker');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create membership status enum
DO $$ BEGIN
  CREATE TYPE membership_status AS ENUM ('pending', 'active', 'inactive');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL DEFAULT 'worker',
  status membership_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_organization_id ON public.memberships(organization_id);

-- Enable RLS
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own memberships
CREATE POLICY "memberships_select_own" ON public.memberships
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Admins can view all memberships in their org
CREATE POLICY "memberships_select_org_admin" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = memberships.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Policy: Super admins can view all memberships
CREATE POLICY "memberships_select_super_admin" ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Policy: Super admins can insert memberships
CREATE POLICY "memberships_insert_super_admin" ON public.memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Policy: Admins can insert memberships for their org (inviting workers)
CREATE POLICY "memberships_insert_org_admin" ON public.memberships
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = memberships.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Policy: Admins can update memberships in their org
CREATE POLICY "memberships_update_org_admin" ON public.memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = memberships.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Now add organization RLS policies (depends on memberships)
CREATE POLICY "organizations_select_member" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = organizations.id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
    )
  );

CREATE POLICY "organizations_select_super_admin" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

CREATE POLICY "organizations_insert_super_admin" ON public.organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

CREATE POLICY "organizations_update_super_admin" ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );
