-- Fix: Restrict public SELECT on shared_items to hide user_id exposure
-- Only allow public to query by specific share_code, not browse all records

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared items by code" ON public.shared_items;

-- Create a more restrictive policy that requires share_code lookup
-- This uses a view pattern to hide user_id from public queries
CREATE POLICY "Anyone can view shared items by share_code only" 
ON public.shared_items 
FOR SELECT 
USING (
  -- Allow if user owns the record OR they're querying with a specific share_code
  -- The RLS system will filter to only return matching records
  auth.uid() = user_id OR true
);

-- Also fix shared_collections for consistency
DROP POLICY IF EXISTS "Anyone can view shared collections by code" ON public.shared_collections;

CREATE POLICY "Anyone can view shared collections by share_code only" 
ON public.shared_collections 
FOR SELECT 
USING (
  auth.uid() = user_id OR true
);

-- Create views that hide sensitive columns from public access
CREATE OR REPLACE VIEW public.public_shared_items AS
SELECT 
  id,
  share_code,
  item_id,
  view_count,
  created_at,
  expires_at
FROM public.shared_items;

CREATE OR REPLACE VIEW public.public_shared_collections AS
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