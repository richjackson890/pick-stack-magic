-- ============================================
-- Bookmarks feature migration
-- ============================================

CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tip_id UUID NOT NULL REFERENCES public.tips(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, tip_id)
);

ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
  ON public.bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can bookmark"
  ON public.bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own bookmarks"
  ON public.bookmarks FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_tip ON public.bookmarks(tip_id);
