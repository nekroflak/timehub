-- Create notes table
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_organization_id ON public.notes(organization_id);
CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own notes only
CREATE POLICY "notes_select_own" ON public.notes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own notes
CREATE POLICY "notes_insert_own" ON public.notes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notes
CREATE POLICY "notes_update_own" ON public.notes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own notes
CREATE POLICY "notes_delete_own" ON public.notes
  FOR DELETE USING (auth.uid() = user_id);
