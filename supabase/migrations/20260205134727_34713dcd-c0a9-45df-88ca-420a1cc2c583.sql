-- Add usage tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS items_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_analysis_count integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_reset_at timestamp with time zone NOT NULL DEFAULT now();

-- Create a function to increment items count
CREATE OR REPLACE FUNCTION public.increment_items_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET items_count = items_count + 1,
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Create a function to decrement items count
CREATE OR REPLACE FUNCTION public.decrement_items_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET items_count = GREATEST(0, items_count - 1),
      updated_at = now()
  WHERE user_id = OLD.user_id;
  RETURN OLD;
END;
$$;

-- Create a function to increment AI analysis count
CREATE OR REPLACE FUNCTION public.increment_ai_analysis_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only count when ai_status changes to 'done'
  IF NEW.ai_status = 'done' AND (OLD.ai_status IS NULL OR OLD.ai_status != 'done') THEN
    UPDATE public.profiles 
    SET ai_analysis_count = ai_analysis_count + 1,
        updated_at = now()
    WHERE user_id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS on_item_insert_count ON public.items;
CREATE TRIGGER on_item_insert_count
  AFTER INSERT ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.increment_items_count();

DROP TRIGGER IF EXISTS on_item_delete_count ON public.items;
CREATE TRIGGER on_item_delete_count
  AFTER DELETE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.decrement_items_count();

DROP TRIGGER IF EXISTS on_ai_analysis_done ON public.items;
CREATE TRIGGER on_ai_analysis_done
  AFTER UPDATE ON public.items
  FOR EACH ROW EXECUTE FUNCTION public.increment_ai_analysis_count();

-- Function to reset monthly counts (can be called by cron)
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET ai_analysis_count = 0,
      monthly_reset_at = now(),
      updated_at = now()
  WHERE monthly_reset_at < now() - interval '30 days';
END;
$$;