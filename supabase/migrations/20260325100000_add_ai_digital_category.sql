-- Add AI/디지털 category
INSERT INTO public.categories (name, color, icon) VALUES
  ('AI/디지털', '#8b5cf6', 'robot')
ON CONFLICT (name) DO NOTHING;
