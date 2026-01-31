-- Create shared_items table for individual item sharing
CREATE TABLE public.shared_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id uuid NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  share_code text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT NULL,
  view_count integer NOT NULL DEFAULT 0
);

-- Create shared_collections table for category/collection sharing
CREATE TABLE public.shared_collections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  share_code text NOT NULL UNIQUE,
  item_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone DEFAULT NULL,
  view_count integer NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.shared_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_collections ENABLE ROW LEVEL SECURITY;

-- Owner policies for shared_items
CREATE POLICY "Users can view own shared items"
ON public.shared_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared items"
ON public.shared_items FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared items"
ON public.shared_items FOR DELETE
USING (auth.uid() = user_id);

-- Owner policies for shared_collections
CREATE POLICY "Users can view own shared collections"
ON public.shared_collections FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create shared collections"
ON public.shared_collections FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own shared collections"
ON public.shared_collections FOR DELETE
USING (auth.uid() = user_id);

-- Public read policies (anyone with the share code can view)
CREATE POLICY "Anyone can view shared items by code"
ON public.shared_items FOR SELECT
USING (true);

CREATE POLICY "Anyone can view shared collections by code"
ON public.shared_collections FOR SELECT
USING (true);

-- Allow view count updates for public access
CREATE POLICY "Anyone can update view count on shared items"
ON public.shared_items FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can update view count on shared collections"
ON public.shared_collections FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create indexes for fast lookup
CREATE INDEX idx_shared_items_share_code ON public.shared_items(share_code);
CREATE INDEX idx_shared_collections_share_code ON public.shared_collections(share_code);
CREATE INDEX idx_shared_items_item_id ON public.shared_items(item_id);
CREATE INDEX idx_shared_collections_category_id ON public.shared_collections(category_id);