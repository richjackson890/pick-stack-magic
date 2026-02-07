-- Fix security definer view issue - recreate views with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_shared_items;
DROP VIEW IF EXISTS public.public_shared_collections;

-- Recreate views with explicit SECURITY INVOKER (default but explicit is safer)
CREATE VIEW public.public_shared_items 
WITH (security_invoker = true)
AS
SELECT 
  id,
  share_code,
  item_id,
  view_count,
  created_at,
  expires_at
FROM public.shared_items;

CREATE VIEW public.public_shared_collections 
WITH (security_invoker = true)
AS
SELECT 
  id,
  share_code,
  title,
  description,
  item_ids,
  category_id,
  view_count,
  created_at,
  expires_at
FROM public.shared_collections;

-- Grant access to anonymous users for the views
GRANT SELECT ON public.public_shared_items TO anon;
GRANT SELECT ON public.public_shared_collections TO anon;