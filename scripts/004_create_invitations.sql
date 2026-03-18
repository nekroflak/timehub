-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role membership_role NOT NULL DEFAULT 'worker',
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_token ON public.invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_organization_id ON public.invitations(organization_id);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Super admins can manage all invitations
CREATE POLICY "invitations_all_super_admin" ON public.invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

-- Policy: Admins can view invitations for their org
CREATE POLICY "invitations_select_org_admin" ON public.invitations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = invitations.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Policy: Admins can insert invitations for their org
CREATE POLICY "invitations_insert_org_admin" ON public.invitations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
      AND m.organization_id = invitations.organization_id
      AND m.role = 'admin'
      AND m.status = 'active'
    )
  );

-- Policy: Anyone can read invitation by token (for accepting)
-- This uses a function to check if the token matches
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(invite_token UUID)
RETURNS SETOF public.invitations
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.invitations
  WHERE token = invite_token
  AND expires_at > now()
  AND accepted_at IS NULL;
$$;
