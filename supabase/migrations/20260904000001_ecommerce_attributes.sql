-- Migration: E-commerce product attribute registry
-- A lightweight, flexible attribute/value registry so attribute names and their
-- permitted values can be created once and reused across products & variants
-- (e.g. "Size" -> S, M, L, XL) without creating duplicates. The variant
-- `attributes` JSONB still stores the resolved value string for each attribute.
-- Idempotent.

-- Attributes (name + slug) -------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_attributes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    has_presets BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ec_attributes_name_idx ON public.ec_attributes (LOWER(name));

-- Attribute values (global, reusable) --------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_attribute_values (
    id TEXT PRIMARY KEY,
    attribute_id TEXT NOT NULL REFERENCES public.ec_attributes(id) ON DELETE CASCADE,
    value TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ec_attr_values_uq ON public.ec_attribute_values (attribute_id, LOWER(value));

-- RLS off + grants, matching the rest of the e-commerce schema -------------
ALTER TABLE public.ec_attributes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_attribute_values DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ec_attributes, public.ec_attribute_values TO anon, authenticated, service_role;
