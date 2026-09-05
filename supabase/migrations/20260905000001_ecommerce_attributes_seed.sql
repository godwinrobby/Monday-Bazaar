-- Seed: attribute groups + values + product→group assignments
-- Safe to re-run (only inserts when target tables are empty).

-- Attribute groups (ec_attributes) -------------------------------------------------
INSERT INTO public.ec_attributes (id, name, slug, has_presets, is_active, created_at)
SELECT * FROM (VALUES
  ('ec-attr-size',    'Size',    'size',    true, true, NOW()),
  ('ec-attr-color',   'Color',   'color',   true, true, NOW()),
  ('ec-attr-storage', 'Storage', 'storage', true, true, NOW()),
  ('ec-attr-ram',     'RAM',     'ram',     true, true, NOW()),
  ('ec-attr-material','Material','material',true, true, NOW())
) AS t(id, name, slug, has_presets, is_active, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_attributes WHERE slug IN ('size','color','storage','ram','material'));

-- Attribute values (ec_attribute_values) -------------------------------------------
INSERT INTO public.ec_attribute_values (id, attribute_id, value, sort_order, is_active)
SELECT * FROM (VALUES
  ('ec-av-size-xs',  'ec-attr-size',  'XS',  0, true),
  ('ec-av-size-s',   'ec-attr-size',  'S',   10, true),
  ('ec-av-size-m',   'ec-attr-size',  'M',   20, true),
  ('ec-av-size-l',   'ec-attr-size',  'L',   30, true),
  ('ec-av-size-xl',  'ec-attr-size',  'XL',  40, true),
  ('ec-av-size-xxl', 'ec-attr-size',  'XXL', 50, true),

  ('ec-av-color-black',  'ec-attr-color', 'Black',  0, true),
  ('ec-av-color-white',  'ec-attr-color', 'White',  10, true),
  ('ec-av-color-grey',   'ec-attr-color', 'Grey',   20, true),
  ('ec-av-color-navy',   'ec-attr-color', 'Navy',   30, true),
  ('ec-av-color-red',    'ec-attr-color', 'Red',    40, true),
  ('ec-av-color-blue',   'ec-attr-color', 'Blue',   50, true),
  ('ec-av-color-green',  'ec-attr-color', 'Green',  60, true),
  ('ec-av-color-beige',  'ec-attr-color', 'Beige',  70, true),
  ('ec-av-color-pink',   'ec-attr-color', 'Pink',   80, true),

  ('ec-av-storage-128',  'ec-attr-storage', '128GB',  0, true),
  ('ec-av-storage-256',  'ec-attr-storage', '256GB',  10, true),
  ('ec-av-storage-512',  'ec-attr-storage', '512GB',  20, true),
  ('ec-av-storage-1tb',  'ec-attr-storage', '1TB',    30, true),

  ('ec-av-ram-8gb',  'ec-attr-ram', '8GB',  0, true),
  ('ec-av-ram-16gb', 'ec-attr-ram', '16GB', 10, true),
  ('ec-av-ram-32gb', 'ec-attr-ram', '32GB', 20, true)
) AS t(id, attribute_id, value, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_attribute_values LIMIT 1);

-- Product → Attribute Group assignments ----------------------------------------------
-- ec-prod-2 (MacBook Air M2) → Storage + RAM + Color
-- ec-prod-3 (Nike shoe)      → Size + Color
-- ec-prod-5 (Men's shirt)    → Size + Color
-- ec-prod-6 (Women dress)    → Size + Color
INSERT INTO public.ec_product_attribute_groups (id, product_id, attribute_id, sort_order, is_active)
SELECT * FROM (VALUES
  ('ec-pag-2-storage',  'ec-prod-2', 'ec-attr-storage', 0, true),
  ('ec-pag-2-ram',      'ec-prod-2', 'ec-attr-ram',     1, true),
  ('ec-pag-2-color',    'ec-prod-2', 'ec-attr-color',   2, true),

  ('ec-pag-3-size',     'ec-prod-3', 'ec-attr-size',    0, true),
  ('ec-pag-3-color',    'ec-prod-3', 'ec-attr-color',   1, true),

  ('ec-pag-5-size',     'ec-prod-5', 'ec-attr-size',    0, true),
  ('ec-pag-5-color',    'ec-prod-5', 'ec-attr-color',   1, true),

  ('ec-pag-6-size',     'ec-prod-6', 'ec-attr-size',    0, true),
  ('ec-pag-6-color',    'ec-prod-6', 'ec-attr-color',   1, true)
) AS t(id, product_id, attribute_id, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_product_attribute_groups LIMIT 1);
