-- Fix infinite recursion in profiles RLS policy
-- The issue is that profiles_select_super_admin queries profiles table to check is_super_admin,
-- which triggers RLS checks again, causing infinite recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "profiles_select_super_admin" ON public.profiles;

-- Create a security definer function to check super admin status without RLS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_super_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Recreate the super admin policy using the function
CREATE POLICY "profiles_select_super_admin" ON public.profiles
  FOR SELECT USING (public.is_super_admin());
