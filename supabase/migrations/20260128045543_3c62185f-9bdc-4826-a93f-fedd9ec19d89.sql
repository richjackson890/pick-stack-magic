-- Add missing AI tracking columns to items table
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS ai_started_at timestamptz;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS ai_finished_at timestamptz;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS ai_attempts integer NOT NULL DEFAULT 0;