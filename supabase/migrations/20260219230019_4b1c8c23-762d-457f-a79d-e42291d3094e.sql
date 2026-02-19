
-- 1. Drop overly permissive public SELECT policies
DROP POLICY IF EXISTS "Anyone can view shared items by share_code only" ON public.shared_items;
DROP POLICY IF EXISTS "Anyone can view shared collections by share_code only" ON public.shared_collections;

-- 2. Create secure RPC for public shared item lookup (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_shared_item_public(p_share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'shared', json_build_object(
      'id', si.id,
      'share_code', si.share_code,
      'view_count', si.view_count,
      'created_at', si.created_at,
      'expires_at', si.expires_at
    ),
    'item', json_build_object(
      'id', i.id,
      'title', i.title,
      'url', i.url,
      'platform', i.platform,
      'thumbnail_url', i.thumbnail_url,
      'summary_3lines', i.summary_3lines,
      'tags', i.tags,
      'created_at', i.created_at,
      'category_id', i.category_id
    ),
    'category', CASE WHEN c.id IS NOT NULL THEN json_build_object(
      'id', c.id,
      'name', c.name,
      'color', c.color,
      'icon', c.icon
    ) ELSE NULL END
  ) INTO result
  FROM shared_items si
  JOIN items i ON i.id = si.item_id
  LEFT JOIN categories c ON c.id = i.category_id
  WHERE si.share_code = p_share_code
    AND (si.expires_at IS NULL OR si.expires_at > now());

  RETURN result;
END;
$$;

-- 3. Create secure RPC for public shared collection lookup (no user_id exposed)
CREATE OR REPLACE FUNCTION public.get_shared_collection_public(p_share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
  collection_record record;
  items_json json;
  category_json json;
BEGIN
  SELECT * INTO collection_record
  FROM shared_collections sc
  WHERE sc.share_code = p_share_code
    AND (sc.expires_at IS NULL OR sc.expires_at > now());

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Fetch items
  SELECT json_agg(json_build_object(
    'id', i.id,
    'title', i.title,
    'url', i.url,
    'platform', i.platform,
    'thumbnail_url', i.thumbnail_url,
    'summary_3lines', i.summary_3lines,
    'tags', i.tags,
    'created_at', i.created_at
  )) INTO items_json
  FROM items i
  WHERE i.id = ANY(collection_record.item_ids);

  -- Fetch category
  IF collection_record.category_id IS NOT NULL THEN
    SELECT json_build_object(
      'id', c.id,
      'name', c.name,
      'color', c.color,
      'icon', c.icon
    ) INTO category_json
    FROM categories c
    WHERE c.id = collection_record.category_id;
  END IF;

  result := json_build_object(
    'shared', json_build_object(
      'id', collection_record.id,
      'share_code', collection_record.share_code,
      'title', collection_record.title,
      'description', collection_record.description,
      'view_count', collection_record.view_count,
      'created_at', collection_record.created_at,
      'expires_at', collection_record.expires_at
    ),
    'items', COALESCE(items_json, '[]'::json),
    'category', category_json
  );

  RETURN result;
END;
$$;
