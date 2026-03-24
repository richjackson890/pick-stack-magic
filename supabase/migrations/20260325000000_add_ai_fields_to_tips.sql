-- Add AI analysis columns to tips table
ALTER TABLE public.tips ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.tips ADD COLUMN IF NOT EXISTS ai_tags TEXT[] DEFAULT '{}';
ALTER TABLE public.tips ADD COLUMN IF NOT EXISTS ai_suggested_category TEXT;
ALTER TABLE public.tips ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'pending';
