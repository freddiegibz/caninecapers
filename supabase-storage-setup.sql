-- Storage Bucket Setup Instructions
-- Run these in Supabase Dashboard → Storage

-- 1. Create the storage bucket (do this in Storage UI, not SQL):
--    - Go to Storage → Create Bucket
--    - Name: "gallery"
--    - Public bucket: YES (checked)
--    - File size limit: 5 MB (or your preference)
--    - Allowed MIME types: image/*

-- 2. Storage Policies (run these in SQL Editor):

-- Policy: Anyone can view gallery images
CREATE POLICY "Gallery images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

-- Policy: Authenticated users can upload images
CREATE POLICY "Authenticated users can upload gallery images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'gallery' AND
    (storage.foldername(name))[1] = 'gallery'
  );

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete their own gallery images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'gallery' AND
    (storage.foldername(name))[1] = 'gallery' AND
    auth.uid()::text = (storage.foldername(name))[2]
  );





