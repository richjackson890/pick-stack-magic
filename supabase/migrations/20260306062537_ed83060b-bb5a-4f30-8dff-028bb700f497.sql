
-- 1. creator_channels 테이블
CREATE TABLE public.creator_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL,
  tone_keywords text[] DEFAULT '{}',
  content_formula text,
  posting_schedule int[] DEFAULT '{}',
  target_hashtags text[] DEFAULT '{}',
  color text DEFAULT '#4A90D9',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels" ON public.creator_channels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own channels" ON public.creator_channels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own channels" ON public.creator_channels FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own channels" ON public.creator_channels FOR DELETE USING (auth.uid() = user_id);

-- 2. content_ideas 테이블
CREATE TABLE public.content_ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES public.creator_channels(id) ON DELETE CASCADE,
  title text NOT NULL,
  hook text,
  format text DEFAULT 'carousel',
  content_layers jsonb DEFAULT '[]',
  hashtags text[] DEFAULT '{}',
  estimated_engagement text DEFAULT 'mid',
  reference_item_ids uuid[] DEFAULT '{}',
  status text DEFAULT 'idea',
  scheduled_date date,
  draft_content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.content_ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas" ON public.content_ideas FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ideas" ON public.content_ideas FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ideas" ON public.content_ideas FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ideas" ON public.content_ideas FOR DELETE USING (auth.uid() = user_id);
