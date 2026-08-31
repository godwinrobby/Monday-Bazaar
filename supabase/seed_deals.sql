-- Demo data for testing pagination & category results (User App).
-- Run in Supabase Dashboard -> SQL Editor. Safe to re-run: skips if demo deals already exist.
-- Creates 175 demo deals (5 templates x 5 stores x 7 categories) so page/limit/category
-- pagination has data to page through.

INSERT INTO deals (id, title, description, store, category, originalprice, dealprice,
                   discountpercentage, couponcode, imageurl, dealurl, islootdeal,
                   isverified, isactive, upvotes, downvotes, aiscore, aiverdict,
                   aipros, aicons, postedat, postedby)
SELECT
  gen_random_uuid()::text,
  t.title || ' — ' || c.name,
  'Demo ' || c.name || ' deal. Limited-time verified price drop from ' || s.store || '.',
  s.store,
  c.name,
  t.mrp,
  round(t.mrp * (100 - p.pct) / 100.0),
  p.pct,
  CASE WHEN (c.ordinality % 3) = 0 THEN 'SAVE' || p.pct ELSE '' END,
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
  'https://www.amazon.in',
  (c.ordinality % 5) = 0,
  true,
  true,
  10 + (c.ordinality * 7) % 240,
  (c.ordinality % 4),
  80 + (c.ordinality * 3) % 20,
  'Community submitted price drop verified.',
  '["Substantial discount off MRP","Community verified link"]'::jsonb,
  '["Check store delivery pin code before checkout"]'::jsonb,
  'Recently',
  'Demo Seeder'
FROM (VALUES
  ('Premium Wireless Headphones', 4999, 1),
  ('Smart LED TV 43-inch', 24999, 2),
  ('Ultrabook Laptop 16GB RAM', 59999, 3),
  ('5G Smartphone 128GB', 18999, 4),
  ('Analog Wrist Watch Classic', 2199, 5)
) AS t(title, mrp, n)
CROSS JOIN (VALUES
  ('Electronics & Laptops', 1), ('Mobiles & Tablets', 2), ('Fashion & Apparel', 3),
  ('Home & Kitchen', 4), ('Beauty & Personal Care', 5), ('Grocery & Essentials', 6),
  ('Travel & Flights', 7)
) AS c(name, ordinality)
CROSS JOIN (VALUES ('Amazon', 1), ('Flipkart', 2), ('Myntra', 3), ('Ajio', 4), ('Croma', 5)) AS s(store, ordinality)
CROSS JOIN (VALUES (35, 1), (45, 2), (55, 3), (65, 4), (75, 5)) AS p(pct, ordinality)
WHERE NOT EXISTS (SELECT 1 FROM deals WHERE postedby = 'Demo Seeder');