
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS draft_generation_count integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.profiles 
  SET ai_analysis_count = 0,
      idea_generation_count = 0,
      draft_generation_count = 0,
      monthly_reset_at = now(),
      updated_at = now()
  WHERE monthly_reset_at < now() - interval '30 days';
END;
$function$;
