-- Drop the old combined function
DROP FUNCTION IF EXISTS public.increment_shared_view_count(text, text);

-- Create separate function for shared_items with expiry validation
CREATE OR REPLACE FUNCTION public.increment_shared_item_views(p_share_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE shared_items
  SET view_count = view_count + 1
  WHERE share_code = p_share_code
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Create separate function for shared_collections with expiry validation
CREATE OR REPLACE FUNCTION public.increment_shared_collection_views(p_share_code text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE shared_collections
  SET view_count = view_count + 1
  WHERE share_code = p_share_code
    AND (expires_at IS NULL OR expires_at > now())
  RETURNING view_count INTO new_count;

  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant access to anon for public share viewing
GRANT EXECUTE ON FUNCTION public.increment_shared_item_views(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_shared_collection_views(text) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_shared_item_views(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_shared_collection_views(text) TO authenticated;