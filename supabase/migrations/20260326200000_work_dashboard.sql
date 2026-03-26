-- ============================================
-- Work Dashboard tables
-- ============================================

-- 1. Projects
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT
  USING (created_by = auth.uid());
CREATE POLICY "Authenticated users can create projects" ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update projects" ON public.projects FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete projects" ON public.projects FOR DELETE
  USING (auth.uid() = created_by);

-- 2. Project members
CREATE TABLE IF NOT EXISTS public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  UNIQUE(project_id, user_id)
);

ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view project members" ON public.project_members FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects));
CREATE POLICY "Project creator can manage members" ON public.project_members FOR INSERT
  WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE created_by = auth.uid()));
CREATE POLICY "Project creator can remove members" ON public.project_members FOR DELETE
  USING (project_id IN (SELECT id FROM public.projects WHERE created_by = auth.uid()) OR user_id = auth.uid());

-- 3. Team events / schedule
CREATE TABLE IF NOT EXISTS public.team_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON public.team_events FOR SELECT
  USING (created_by = auth.uid());
CREATE POLICY "Authenticated users can create events" ON public.team_events FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creator can update events" ON public.team_events FOR UPDATE
  USING (auth.uid() = created_by);
CREATE POLICY "Creator can delete events" ON public.team_events FOR DELETE
  USING (auth.uid() = created_by);

-- 4. Leaves (연차/반차)
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  leave_date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('full', 'half_am', 'half_pm')),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own leaves" ON public.leaves FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can create own leaves" ON public.leaves FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own leaves" ON public.leaves FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Leave balance
CREATE TABLE IF NOT EXISTS public.leave_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  total_days NUMERIC(4,1) NOT NULL DEFAULT 15,
  used_days NUMERIC(4,1) NOT NULL DEFAULT 0
);

ALTER TABLE public.leave_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view team balances" ON public.leave_balance FOR SELECT
  USING (user_id = auth.uid() OR user_id IN (
    SELECT tm.user_id FROM public.team_members_v2 tm
    WHERE tm.team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid())
  ));
CREATE POLICY "Users can manage own balance" ON public.leave_balance FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own balance" ON public.leave_balance FOR UPDATE
  USING (auth.uid() = user_id);

-- 6. Project types (user-customizable)
CREATE TABLE IF NOT EXISTS public.project_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.project_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all project types" ON public.project_types FOR SELECT
  USING (true);
CREATE POLICY "Users can create project types" ON public.project_types FOR INSERT
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete own custom types" ON public.project_types FOR DELETE
  USING (auth.uid() = created_by AND is_default = false);

-- Seed default project types
INSERT INTO public.project_types (name, is_default) VALUES
  ('현상설계', true),
  ('실시설계', true),
  ('계획설계', true),
  ('감리', true),
  ('인허가', true),
  ('기타', true)
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON public.projects(created_by);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON public.project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_team_events_date ON public.team_events(event_date);
CREATE INDEX IF NOT EXISTS idx_leaves_date ON public.leaves(leave_date);
CREATE INDEX IF NOT EXISTS idx_leaves_user ON public.leaves(user_id);
