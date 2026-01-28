-- Add enhanced metadata fields for search and discovery
ALTER TABLE public.items 
ADD COLUMN IF NOT EXISTS fallback_title text,
ADD COLUMN IF NOT EXISTS smart_snippet text,
ADD COLUMN IF NOT EXISTS core_keywords text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS entities text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS hashtags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS intent text,
ADD COLUMN IF NOT EXISTS search_blob text;

-- Create GIN index for array fields for faster search
CREATE INDEX IF NOT EXISTS idx_items_core_keywords ON public.items USING GIN (core_keywords);
CREATE INDEX IF NOT EXISTS idx_items_entities ON public.items USING GIN (entities);
CREATE INDEX IF NOT EXISTS idx_items_hashtags ON public.items USING GIN (hashtags);

-- Create full-text search index on search_blob
CREATE INDEX IF NOT EXISTS idx_items_search_blob ON public.items USING GIN (to_tsvector('simple', COALESCE(search_blob, '')));

-- Function to build search_blob from other fields
CREATE OR REPLACE FUNCTION public.build_search_blob()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_blob := COALESCE(NEW.title, '') || ' ' || 
                     COALESCE(NEW.fallback_title, '') || ' ' ||
                     COALESCE(NEW.smart_snippet, '') || ' ' ||
                     COALESCE(array_to_string(NEW.core_keywords, ' '), '') || ' ' ||
                     COALESCE(array_to_string(NEW.hashtags, ' '), '') || ' ' ||
                     COALESCE(array_to_string(NEW.entities, ' '), '') || ' ' ||
                     COALESCE(array_to_string(NEW.tags, ' '), '') || ' ' ||
                     COALESCE(NEW.user_note, '') || ' ' ||
                     COALESCE(NEW.platform, '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-update search_blob
DROP TRIGGER IF EXISTS trigger_build_search_blob ON public.items;
CREATE TRIGGER trigger_build_search_blob
BEFORE INSERT OR UPDATE ON public.items
FOR EACH ROW
EXECUTE FUNCTION public.build_search_blob();

-- Create a function for full-text search with ranking
CREATE OR REPLACE FUNCTION public.search_items(
  p_user_id uuid,
  p_query text,
  p_categories uuid[] DEFAULT NULL,
  p_platforms text[] DEFAULT NULL,
  p_limit int DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  title text,
  fallback_title text,
  smart_snippet text,
  thumbnail_url text,
  platform text,
  category_id uuid,
  core_keywords text[],
  hashtags text[],
  entities text[],
  tags text[],
  created_at timestamptz,
  ai_status text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id,
    i.title,
    i.fallback_title,
    i.smart_snippet,
    i.thumbnail_url,
    i.platform,
    i.category_id,
    i.core_keywords,
    i.hashtags,
    i.entities,
    i.tags,
    i.created_at,
    i.ai_status,
    ts_rank(to_tsvector('simple', COALESCE(i.search_blob, '')), plainto_tsquery('simple', p_query)) AS rank
  FROM public.items i
  WHERE i.user_id = p_user_id
    AND (p_query IS NULL OR p_query = '' OR 
         to_tsvector('simple', COALESCE(i.search_blob, '')) @@ plainto_tsquery('simple', p_query) OR
         i.search_blob ILIKE '%' || p_query || '%')
    AND (p_categories IS NULL OR i.category_id = ANY(p_categories))
    AND (p_platforms IS NULL OR i.platform = ANY(p_platforms))
  ORDER BY 
    CASE WHEN p_query IS NOT NULL AND p_query != '' 
         THEN ts_rank(to_tsvector('simple', COALESCE(i.search_blob, '')), plainto_tsquery('simple', p_query)) 
         ELSE 0 END DESC,
    i.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;