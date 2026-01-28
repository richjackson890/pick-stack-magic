-- Create storage bucket for cover images
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own covers
CREATE POLICY "Users can upload covers"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to covers
CREATE POLICY "Public can view covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'covers');

-- Allow users to update their own covers
CREATE POLICY "Users can update own covers"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own covers
CREATE POLICY "Users can delete own covers"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'covers' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);