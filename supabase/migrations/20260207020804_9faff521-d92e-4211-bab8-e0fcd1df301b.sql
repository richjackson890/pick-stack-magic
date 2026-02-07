-- Create atomic view count increment function
CREATE OR REPLACE FUNCTION public.increment_shared_view_count(
  p_share_code text,
  p_table_name text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  IF p_table_name = 'shared_items' THEN
    UPDATE public.shared_items
    SET view_count = view_count + 1
    WHERE share_code = p_share_code
    RETURNING view_count INTO new_count;
  ELSIF p_table_name = 'shared_collections' THEN
    UPDATE public.shared_collections
    SET view_count = view_count + 1
    WHERE share_code = p_share_code
    RETURNING view_count INTO new_count;
  END IF;
  
  RETURN COALESCE(new_count, 0);
END;
$$;

-- Grant execute permission to anonymous and authenticated users
GRANT EXECUTE ON FUNCTION public.increment_shared_view_count(text, text) TO anon, authenticated;

-- Remove the problematic UPDATE policies that allowed race conditions
DROP POLICY IF EXISTS "Anyone can increment view count on shared items" ON public.shared_items;
DROP POLICY IF EXISTS "Anyone can increment view count on shared collections" ON public.shared_collections;