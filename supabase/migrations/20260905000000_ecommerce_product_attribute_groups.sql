-- Migration: Product ↔ Attribute Group assignment
-- Links variable (and simple) products to the attribute groups they use
-- (e.g. a T-shirt variable product is assigned the "Size" and "Color" groups).
-- Prevents duplicate assignments per product+group. Idempotent.

CREATE TABLE IF NOT EXISTS public.ec_product_attribute_groups (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES public.ec_products(id) ON DELETE CASCADE,
    attribute_id TEXT NOT NULL REFERENCES public.ec_attributes(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (product_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_ec_product_attribute_groups_product
    ON public.ec_product_attribute_groups (product_id);
CREATE INDEX IF NOT EXISTS idx_ec_product_attribute_groups_attribute
    ON public.ec_product_attribute_groups (attribute_id);

ALTER TABLE public.ec_product_attribute_groups DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ec_product_attribute_groups TO anon, authenticated, service_role;
