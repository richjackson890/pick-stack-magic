-- 1. Add DELETE policy for profiles table (GDPR compliance)
CREATE POLICY "Users can delete own profile"
  ON public.profiles FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Fix shared_items UPDATE policy - restrict to only incrementing view_count
DROP POLICY IF EXISTS "Anyone can update view count on shared items" ON public.shared_items;

CREATE POLICY "Anyone can increment view count on shared items"
  ON public.shared_items FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow incrementing view_count by 1, no other field changes
    view_count = (SELECT view_count + 1 FROM public.shared_items WHERE id = shared_items.id)
  );

-- 3. Fix shared_collections UPDATE policy - restrict to only incrementing view_count
DROP POLICY IF EXISTS "Anyone can update view count on shared collections" ON public.shared_collections;

CREATE POLICY "Anyone can increment view count on shared collections"
  ON public.shared_collections FOR UPDATE
  USING (true)
  WITH CHECK (
    -- Only allow incrementing view_count by 1, no other field changes
    view_count = (SELECT view_count + 1 FROM public.shared_collections WHERE id = shared_collections.id)
  );