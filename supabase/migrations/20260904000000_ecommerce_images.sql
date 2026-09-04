-- Migration: E-commerce product image storage
-- Creates a public Supabase Storage bucket for e-commerce images plus permissive
-- RLS policies (matching the rest of the e-commerce schema, which is open to
-- anon/authenticated/service_role). Also adds an `images` JSONB column to
-- ec_variants so each variant can carry its own gallery. Idempotent.

-- Buckets (idempotent) -------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ecommerce-images', 'ecommerce-images', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

-- Storage object policies (idempotent) --------------------------------------
-- Drop + recreate so re-running the migration does not error on existing policies.
DROP POLICY IF EXISTS "ecommerce_images_access" ON storage.objects;
CREATE POLICY "ecommerce_images_access" ON storage.objects
  FOR ALL TO anon, authenticated, service_role
  USING (bucket_id = 'ecommerce-images')
  WITH CHECK (bucket_id = 'ecommerce-images');

-- Variant gallery column ----------------------------------------------------
ALTER TABLE public.ec_variants ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.ec_variants.images IS 'Gallery of image URLs for this variant';
