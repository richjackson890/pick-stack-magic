-- ============================================
-- Team, Likes, Comments feature migration
-- ============================================

-- 1. Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  USING (
    id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team owner can update"
  ON public.teams FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Team owner can delete"
  ON public.teams FOR DELETE
  USING (auth.uid() = created_by);

-- 2. Team members v2 (proper team_id reference)
CREATE TABLE IF NOT EXISTS public.team_members_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view members"
  ON public.team_members_v2 FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owner can insert members"
  ON public.team_members_v2 FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Team owner can remove members"
  ON public.team_members_v2 FOR DELETE
  USING (
    auth.uid() = user_id
    OR team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 3. Team invites
CREATE TABLE IF NOT EXISTS public.team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.team_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view invites"
  ON public.team_invites FOR SELECT
  USING (
    team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid())
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Team owner can create invites"
  ON public.team_invites FOR INSERT
  WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid() AND role = 'owner')
  );

CREATE POLICY "Invited user or owner can update invite"
  ON public.team_invites FOR UPDATE
  USING (
    email = (SELECT email FROM public.profiles WHERE id = auth.uid())
    OR team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid() AND role = 'owner')
  );

-- 4. Add team_id to tips
ALTER TABLE public.tips ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tips_team_id ON public.tips(team_id);

-- Update tips RLS: team tips visible to team members, personal tips to owner
DROP POLICY IF EXISTS "Anyone can view tips" ON public.tips;
CREATE POLICY "Users can view own or team tips"
  ON public.tips FOR SELECT
  USING (
    user_id = auth.uid()
    OR team_id IN (SELECT team_id FROM public.team_members_v2 WHERE user_id = auth.uid())
  );

-- 5. Tip likes (toggle system)
CREATE TABLE IF NOT EXISTS public.tip_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES public.tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tip_id, user_id)
);

ALTER TABLE public.tip_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view likes"
  ON public.tip_likes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can like"
  ON public.tip_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike own"
  ON public.tip_likes FOR DELETE
  USING (auth.uid() = user_id);

-- 6. Tip comments
CREATE TABLE IF NOT EXISTS public.tip_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip_id UUID NOT NULL REFERENCES public.tips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tip_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on visible tips"
  ON public.tip_comments FOR SELECT
  USING (
    tip_id IN (SELECT id FROM public.tips)
  );

CREATE POLICY "Authenticated users can comment"
  ON public.tip_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.tip_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_team_members_v2_team ON public.team_members_v2(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_v2_user ON public.team_members_v2(user_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON public.team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_email ON public.team_invites(email);
CREATE INDEX IF NOT EXISTS idx_tip_likes_tip ON public.tip_likes(tip_id);
CREATE INDEX IF NOT EXISTS idx_tip_likes_user ON public.tip_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_tip_comments_tip ON public.tip_comments(tip_id);
