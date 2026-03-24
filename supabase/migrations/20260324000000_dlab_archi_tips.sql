-- DLab Archi Tips: Architecture team knowledge sharing tables
-- Migration: Create profiles, tips, categories, and team_members tables

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'folder'
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can manage categories"
  ON public.categories FOR ALL
  USING (auth.role() = 'authenticated');

-- Tips table
CREATE TABLE IF NOT EXISTS public.tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  url TEXT,
  image_url TEXT,
  category UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  competition_name TEXT,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tips"
  ON public.tips FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create tips"
  ON public.tips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tips"
  ON public.tips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tips"
  ON public.tips FOR DELETE
  USING (auth.uid() = user_id);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own team invites"
  ON public.team_members FOR SELECT
  USING (auth.uid() = user_id OR invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Authenticated users can invite"
  ON public.team_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Invited users can update status"
  ON public.team_members FOR UPDATE
  USING (invited_email = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tips_user_id ON public.tips(user_id);
CREATE INDEX IF NOT EXISTS idx_tips_category ON public.tips(category);
CREATE INDEX IF NOT EXISTS idx_tips_created_at ON public.tips(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_invited_email ON public.team_members(invited_email);

-- Seed default categories for architecture team
INSERT INTO public.categories (name, color, icon) VALUES
  ('Design Patterns', '#6366f1', 'layers'),
  ('Cloud Architecture', '#06b6d4', 'cloud'),
  ('DevOps', '#f97316', 'settings'),
  ('Security', '#ef4444', 'shield'),
  ('Performance', '#22c55e', 'zap'),
  ('Best Practices', '#a855f7', 'star'),
  ('Code Review', '#eab308', 'code'),
  ('System Design', '#3b82f6', 'layout')
ON CONFLICT DO NOTHING;
