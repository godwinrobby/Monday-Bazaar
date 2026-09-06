-- Migration: Product ↔ Attribute Values selection
-- Stores the per-product *selected* attribute values (e.g. for a T-shirt assigned
-- the "Size" and "Color" groups, which specific values the admin has checked:
-- Size -> S, M | Color -> Black, White). This powers the WooCommerce-style
-- product attribute value multi-select in Admin → Products → Edit, and drives
-- variant generation. Distinct from ec_attribute_values (the global registry)
-- and from each variant's `attributes` JSONB (the concrete resolved value).
-- Idempotent. RLS off + grants, matching the rest of the e-commerce schema.

CREATE TABLE IF NOT EXISTS public.ec_product_attribute_values (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.ec_products(id) ON DELETE CASCADE,
    attribute_id TEXT NOT NULL REFERENCES public.ec_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Unique per (product, attribute group, value) — case-insensitive via expression index.
CREATE UNIQUE INDEX IF NOT EXISTS ec_product_attribute_values_uq
    ON public.ec_product_attribute_values (product_id, attribute_id, LOWER(value));

CREATE INDEX IF NOT EXISTS idx_ec_product_attribute_values_product
    ON public.ec_product_attribute_values (product_id);
CREATE INDEX IF NOT EXISTS idx_ec_product_attribute_values_attribute
    ON public.ec_product_attribute_values (attribute_id);

ALTER TABLE public.ec_product_attribute_values DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ec_product_attribute_values TO anon, authenticated, service_role;