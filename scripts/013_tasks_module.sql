-- Tasks module: tasks + task_comments tables with RLS
-- Isolated from all existing tables except organizations and profiles (read-only refs)

-- ============================================================
-- TASKS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title           text NOT NULL,
  description     text,
  status          text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'assigned', 'done')),
  assigned_to     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by      uuid NOT NULL REFERENCES public.profiles(id),
  assigned_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TASK COMMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.task_comments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id),
  content         text NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS tasks_organization_id_idx   ON public.tasks(organization_id);
CREATE INDEX IF NOT EXISTS tasks_assigned_to_idx       ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS task_comments_task_id_idx   ON public.task_comments(task_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.tasks         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- Tasks: any org member can select
CREATE POLICY "Org members can view tasks"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tasks.organization_id
    )
  );

-- Tasks: any org member can insert
CREATE POLICY "Org members can insert tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tasks.organization_id
    )
  );

-- Tasks: any org member can update (assign / move columns)
CREATE POLICY "Org members can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tasks.organization_id
    )
  );

-- Tasks: creator or admin can delete
CREATE POLICY "Creator or admin can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = tasks.organization_id
        AND om.role = 'admin'
    )
  );

-- Comments: any org member can select
CREATE POLICY "Org members can view comments"
  ON public.task_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = task_comments.organization_id
    )
  );

-- Comments: any org member can insert
CREATE POLICY "Org members can insert comments"
  ON public.task_comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id = task_comments.organization_id
    )
  );

-- Comments: author can delete own
CREATE POLICY "Author can delete own comments"
  ON public.task_comments FOR DELETE
  USING (auth.uid() = user_id);
