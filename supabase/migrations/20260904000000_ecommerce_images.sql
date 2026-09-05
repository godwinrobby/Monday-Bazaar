-- Migration: E-commerce product image storage (local server storage)
-- Product images are now uploaded to the local server filesystem under
-- `storage/ecommerce/products/{product-id}/` and
-- `storage/ecommerce/products/{product-id}/variants/{variant-id}/`, and
-- served statically at `/storage/...`. Only the relative URL is stored in the
-- database (no base64). This migration only retains the variant image gallery
-- column (the Supabase Storage bucket is no longer used for product images).

ALTER TABLE public.ec_variants ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.ec_variants.images IS 'Gallery of image URLs for this variant';
