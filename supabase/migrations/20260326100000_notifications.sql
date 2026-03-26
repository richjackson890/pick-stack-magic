-- ============================================
-- Notifications feature migration
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like')),
  tip_id UUID NOT NULL REFERENCES public.tips(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_tip ON public.notifications(tip_id);
