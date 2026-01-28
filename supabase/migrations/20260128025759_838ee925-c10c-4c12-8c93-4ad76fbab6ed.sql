-- Add url_hash for deduplication
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS url_hash text;

-- Create index for fast lookup
CREATE INDEX IF NOT EXISTS idx_items_url_hash ON public.items(url_hash);
CREATE INDEX IF NOT EXISTS idx_items_user_url_hash ON public.items(user_id, url_hash);

-- Add auto_analyze setting to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS auto_analyze boolean NOT NULL DEFAULT true;

-- Add analysis mode column (light or deep)
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS analysis_mode text NOT NULL DEFAULT 'light';

-- Add constraint for analysis_mode
ALTER TABLE public.items
ADD CONSTRAINT items_analysis_mode_check 
CHECK (analysis_mode IN ('light', 'deep', 'none'));