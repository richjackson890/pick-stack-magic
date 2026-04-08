-- ============================================
-- Extend notifications: add mention/task types, nullable tip_id, message column
-- ============================================

-- Drop the restrictive type CHECK constraint
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add broader type constraint
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('comment', 'like', 'mention', 'task_assignment', 'task_acknowledged', 'task_completed'));

-- Make tip_id nullable (task/mention notifications may not have a tip)
ALTER TABLE public.notifications ALTER COLUMN tip_id DROP NOT NULL;

-- Add message column if not exists
DO $$ BEGIN
  ALTER TABLE public.notifications ADD COLUMN message TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add project_id column if not exists
DO $$ BEGIN
  ALTER TABLE public.notifications ADD COLUMN project_id UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
