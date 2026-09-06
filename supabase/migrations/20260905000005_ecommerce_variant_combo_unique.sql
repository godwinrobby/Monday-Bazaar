-- Migration: Enforce unique product-variant attribute combinations
-- Adds an `attrs_key` column holding a canonical, normalized combination key
-- (e.g. "color:black|size:m") and a partial UNIQUE index on
-- (product_id, attrs_key). The app writes `attrs_key` on every save (see
-- src/utils/variantAttributes.ts), making case/whitespace variants of the same
-- combination impossible at the database level — a final safeguard on top of the
-- Admin UI + service-layer validation (Create, Edit, Save, CSV import, API).

ALTER TABLE public.ec_variants ADD COLUMN IF NOT EXISTS attrs_key TEXT;

-- Deterministic SQL helper that mirrors JS variantComboKey(): trims + lower-cases
-- keys and values, sorts by key, joins with "|" (key:value).
CREATE OR REPLACE FUNCTION public.ec_variant_attrs_key(attributes jsonb)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    string_agg(btrim(lower(key)) || ':' || btrim(lower(value)), '|' ORDER BY btrim(lower(key))),
    ''
  )
  FROM jsonb_each_text(attributes)
  WHERE btrim(lower(key)) <> '' AND btrim(lower(value)) <> '';
$$;

-- Backfill for existing rows (safe: helper is IMMUTABLE so usable in UPDATE).
UPDATE public.ec_variants v SET attrs_key = public.ec_variant_attrs_key(v.attributes)
WHERE v.attrs_key IS NULL AND v.attributes IS NOT NULL AND v.attributes <> '{}'::jsonb;

-- Drop any pre-existing duplicate attribute combinations, keeping the oldest row
-- (lowest id). Only collapses real combos, never touches empty/missing attributes.
DELETE FROM public.ec_variants a
USING public.ec_variants b
WHERE a.product_id = b.product_id
  AND a.attrs_key = b.attrs_key
  AND COALESCE(a.attrs_key, '') <> ''
  AND a.id > b.id;

-- Final uniqueness safeguard.
CREATE UNIQUE INDEX IF NOT EXISTS ec_variants_product_attrs_key_uq
    ON public.ec_variants (product_id, attrs_key)
    WHERE attrs_key IS NOT NULL AND attrs_key <> '';