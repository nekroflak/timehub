-- ============================================================
-- 014_departments.sql
-- Departments feature for the Tasks Board module
-- ============================================================

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid       NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name           text        NOT NULL,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now(),
  UNIQUE (organization_id, name)
);

-- 2. For each existing organization, seed a default "Ogólne" department
INSERT INTO public.departments (organization_id, name)
SELECT id, 'Ogólne'
FROM   public.organizations
ON CONFLICT (organization_id, name) DO NOTHING;

-- 3. Add department_id to organization_members (nullable for backward compat)
ALTER TABLE public.organization_members
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- 4. Assign all existing members (without a department) to their org's "Ogólne" department
UPDATE public.organization_members om
SET    department_id = d.id
FROM   public.departments d
WHERE  d.organization_id = om.organization_id
  AND  d.name = 'Ogólne'
  AND  om.department_id IS NULL;

-- 5. Add department_id to tasks (nullable for backward compat)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

-- 6. Assign all existing tasks (without a department) to their org's "Ogólne" department
UPDATE public.tasks t
SET    department_id = d.id
FROM   public.departments d
WHERE  d.organization_id = t.organization_id
  AND  d.name = 'Ogólne'
  AND  t.department_id IS NULL;

-- 7. RLS on departments: members of the org can read; admins can insert/update/delete
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view own org departments"  ON public.departments;
DROP POLICY IF EXISTS "Admins can manage own org departments" ON public.departments;

CREATE POLICY "Members can view own org departments"
  ON public.departments FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage own org departments"
  ON public.departments FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
