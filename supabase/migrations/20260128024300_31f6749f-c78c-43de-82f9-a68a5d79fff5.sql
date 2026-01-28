-- Add missing columns for AI analysis pipeline
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS ai_status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_error text,
ADD COLUMN IF NOT EXISTS extracted_text text;

-- Add check constraint for ai_status values
ALTER TABLE public.items
ADD CONSTRAINT items_ai_status_check 
CHECK (ai_status IN ('pending', 'processing', 'done', 'error'));

-- Create index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_items_ai_status ON public.items(ai_status);
CREATE INDEX IF NOT EXISTS idx_items_user_status ON public.items(user_id, ai_status);