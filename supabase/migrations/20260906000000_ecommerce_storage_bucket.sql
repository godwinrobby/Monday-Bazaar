-- Migration: E-commerce product image storage bucket
-- Live static deployments do not run the Node upload endpoint, so the browser
-- uploader falls back to this public Supabase Storage bucket.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ecommerce-images',
  'ecommerce-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public can read ecommerce images" ON storage.objects;
CREATE POLICY "Public can read ecommerce images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'ecommerce-images');

DROP POLICY IF EXISTS "Public can upload ecommerce images" ON storage.objects;
CREATE POLICY "Public can upload ecommerce images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'ecommerce-images'
  AND (storage.foldername(name))[1] = 'products'
);

DROP POLICY IF EXISTS "Public can delete ecommerce images" ON storage.objects;
CREATE POLICY "Public can delete ecommerce images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'ecommerce-images'
  AND (storage.foldername(name))[1] = 'products'
);
