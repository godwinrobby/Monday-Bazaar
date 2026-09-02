-- E-commerce demo data (products, variants, categories, brands, coupons,
-- payments, shipping). Safe to re-run (only inserts when empty).

INSERT INTO public.ec_categories (id, name, slug, parent_id, image, sort_order, is_active)
SELECT * FROM (VALUES
  ('ec-cat-electronics', 'Electronics', 'electronics', NULL, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=400&q=60', 1, true),
  ('ec-cat-mobiles', 'Mobiles & Tablets', 'mobiles-tablets', 'ec-cat-electronics', 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=400&q=60', 1, true),
  ('ec-cat-laptops', 'Laptops & Computers', 'laptops-computers', 'ec-cat-electronics', 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=60', 2, true),
  ('ec-cat-fashion', 'Fashion', 'fashion', NULL, 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=400&q=60', 2, true),
  ('ec-cat-men', 'Men', 'men', 'ec-cat-fashion', 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=400&q=60', 1, true),
  ('ec-cat-women', 'Women', 'women', 'ec-cat-fashion', 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=400&q=60', 2, true),
  ('ec-cat-home', 'Home & Kitchen', 'home-kitchen', NULL, 'https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=400&q=60', 3, true)
) AS t(id, name, slug, parent_id, image, sort_order, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_categories);

INSERT INTO public.ec_brands (id, name, slug, logo, description, is_active)
SELECT * FROM (VALUES
  ('ec-brand-apple', 'Apple', 'apple', 'https://1000logos.net/wp-content/uploads/2016/10/Apple-Logo-500x500.png', 'Premium consumer electronics', true),
  ('ec-brand-samsung', 'Samsung', 'samsung', 'https://1000logos.net/wp-content/uploads/2016/10/Samsung-logo-500x500.png', 'Consumer electronics and appliances', true),
  ('ec-brand-nike', 'Nike', 'nike', 'https://1000logos.net/wp-content/uploads/2016/10/Nike-Logo-500x500.png', 'Athletic footwear and apparel', true),
  ('ec-brand-philips', 'Philips', 'philips', 'https://1000logos.net/wp-content/uploads/2016/10/Philips-logo-500x500.png', 'Home appliances and lighting', true)
) AS t(id, name, slug, logo, description, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_brands);

INSERT INTO public.ec_products (id, name, slug, product_type, description, brand_id, category_id, price, sale_price, sku, stock, images, is_active, featured)
SELECT * FROM (VALUES
  ('ec-prod-1', 'Samsung Galaxy S24 128GB', 'samsung-galaxy-s24', 'simple', 'Flagship smartphone with 50MP camera, 120Hz AMOLED display, and 5G.', 'ec-brand-samsung', 'ec-cat-mobiles', 79999, 69999, 'S24-128-BLK', 25, '["https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, true),
  ('ec-prod-2', 'Apple MacBook Air M2', 'apple-macbook-air-m2', 'variable', 'Ultra-thin laptop with Apple M2 chip, 13.6 inch Liquid Retina display.', 'ec-brand-apple', 'ec-cat-laptops', 114900, 99900, 'MBA-M2-BASE', 15, '["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, true),
  ('ec-prod-3', 'Nike Air Zoom Running Shoe', 'nike-air-zoom', 'variable', 'Lightweight running shoe with responsive Zoom Air cushioning.', 'ec-brand-nike', 'ec-cat-men', 5995, 4395, 'NAZ-M-BLK', 40, '["https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, false),
  ('ec-prod-4', 'Philips Air Fryer 4.2L', 'philips-air-fryer', 'simple', 'Rapid Air technology air fryer for healthy low-fat cooking.', 'ec-brand-philips', 'ec-cat-home', 8995, 6495, 'PAF-42-BLK', 60, '["https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, true),
  ('ec-prod-5', 'Men Casual Slim Fit Shirt', 'men-casual-slim-fit-shirt', 'variable', 'Classic slim fit casual shirt in premium cotton.', 'ec-brand-nike', 'ec-cat-men', 1499, 999, 'MCS-M-COT', 80, '["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, false),
  ('ec-prod-6', 'Women Ethnic Maxi Dress', 'women-ethnic-maxi-dress', 'variable', 'Elegant ethnic maxi dress with embroidered details.', 'ec-brand-nike', 'ec-cat-women', 2499, 1699, 'WEM-M-MIX', 55, '["https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=60"]'::jsonb, true, false)
) AS t(id, name, slug, product_type, description, brand_id, category_id, price, sale_price, sku, stock, images, is_active, featured)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_products LIMIT 1);

INSERT INTO public.ec_variants (id, product_id, sku, price, sale_price, stock, attributes, image, is_active)
SELECT * FROM (VALUES
  ('ec-var-2-1', 'ec-prod-2', 'MBA-M2-8GB-256', 114900, 99900, 8, '{"ram":"8GB","storage":"256GB","color":"Starlight"}'::jsonb, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-2-2', 'ec-prod-2', 'MBA-M2-16GB-512', 134900, 119900, 7, '{"ram":"16GB","storage":"512GB","color":"Midnight"}'::jsonb, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-3-1', 'ec-prod-3', 'NAZ-M-9', 5995, 4395, 20, '{"size":"UK 9","color":"Black"}'::jsonb, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-3-2', 'ec-prod-3', 'NAZ-M-10', 5995, 4395, 20, '{"size":"UK 10","color":"Grey"}'::jsonb, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-5-1', 'ec-prod-5', 'MCS-M-S', 1499, 999, 20, '{"size":"S","color":"Blue"}'::jsonb, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-5-2', 'ec-prod-5', 'MCS-M-L', 1499, 999, 30, '{"size":"L","color":"White"}'::jsonb, 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-6-1', 'ec-prod-6', 'WEM-M-M', 2499, 1699, 30, '{"size":"M","color":"Maroon"}'::jsonb, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=60', true),
  ('ec-var-6-2', 'ec-prod-6', 'WEM-M-L', 2499, 1699, 25, '{"size":"L","color":"Teal"}'::jsonb, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=60', true)
) AS t(id, product_id, sku, price, sale_price, stock, attributes, image, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_variants LIMIT 1);

INSERT INTO public.ec_coupons (id, code, type, value, min_order, max_discount, usage_limit, used, is_active)
SELECT * FROM (VALUES
  ('ec-coupon-1', 'SAVE10', 'percent', 10, 1999, 1500, 100, 0, true),
  ('ec-coupon-2', 'FLAT500', 'fixed', 500, 2999, NULL, 50, 0, true),
  ('ec-coupon-3', 'SALE20', 'percent', 20, 4999, 3000, 200, 0, true)
) AS t(id, code, type, value, min_order, max_discount, usage_limit, used, is_active)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_coupons LIMIT 1);

INSERT INTO public.ec_payment_methods (id, name, enabled, sort_order)
SELECT * FROM (VALUES
  ('ec-pay-cod', 'Cash on Delivery', true, 1),
  ('ec-pay-upi', 'UPI', true, 2),
  ('ec-pay-card', 'Credit / Debit Card', true, 3),
  ('ec-pay-netbanking', 'Net Banking', true, 4)
) AS t(id, name, enabled, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_payment_methods LIMIT 1);

INSERT INTO public.ec_shipping_methods (id, name, charge, min_order_free, estimated_days, enabled, sort_order)
SELECT * FROM (VALUES
  ('ec-ship-standard', 'Standard Delivery', 49, 999, '3-5 days', true, 1),
  ('ec-ship-express', 'Express Delivery', 149, 1999, '1-2 days', true, 2)
) AS t(id, name, charge, min_order_free, estimated_days, enabled, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_shipping_methods LIMIT 1);

-- Demo Orders ---------------------------------------------------------------
INSERT INTO public.ec_orders (id, order_number, customer_name, customer_email, customer_phone, address, status, payment_method, payment_status, shipping_method, shipping_charge, subtotal, discount, coupon_code, total, tracking_number, tracking_company, created_at)
SELECT * FROM (VALUES
  ('ec-order-1', 'MB1234567890', 'Rajesh Kumar', 'rajesh.kumar@example.com', '+91-9876543210',
    '{"name":"Rajesh Kumar","phone":"+91-9876543210","line1":"123 MG Road","line2":"Near City Mall","city":"Mumbai","state":"Maharashtra","pincode":"400001","country":"India"}'::jsonb,
    'delivered', 'Cash on Delivery', 'paid', 'Standard Delivery', 49, 59999, 5999, 'SAVE10', 54049, 'TRK-123456789IN', 'DTDC', '2026-08-20 10:30:00+05:30'::timestamptz),
  ('ec-order-2', 'MB0987654321', 'Priya Sharma', 'priya.sharma@example.com', '+91-8765432109',
    '{"name":"Priya Sharma","phone":"+91-8765432109","line1":"456 Park Street","line2":"","city":"Delhi","state":"Delhi","pincode":"110001","country":"India"}'::jsonb,
    'shipped', 'UPI', 'paid', 'Express Delivery', 149, 119900, 11990, 'SAVE10', 108060, 'TRK-987654321IN', 'Blue Dart', '2026-08-25 14:15:00+05:30'::timestamptz),
  ('ec-order-3', 'MB1122334455', 'Amit Patel', 'amit.patel@example.com', '+91-7654321098',
    '{"name":"Amit Patel","phone":"+91-7654321098","line1":"789 Lake Town","line2":"Ground Floor","city":"Kolkata","state":"West Bengal","pincode":"700001","country":"India"}'::jsonb,
    'pending', 'Credit / Debit Card', 'pending', 'Standard Delivery', 0, 4395, 0, '', 4395, NULL, NULL, '2026-09-01 08:00:00+05:30'::timestamptz)
) AS t(id, order_number, customer_name, customer_email, customer_phone, address, status, payment_method, payment_status, shipping_method, shipping_charge, subtotal, discount, coupon_code, total, tracking_number, tracking_company, created_at)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_orders LIMIT 1);

-- Demo Order Items ----------------------------------------------------------
INSERT INTO public.ec_order_items (id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, total, image, attributes)
SELECT * FROM (VALUES
  ('ec-item-1', 'ec-order-1', 'ec-prod-1', NULL, 'Samsung Galaxy S24 128GB', 'S24-128-BLK', 1, 69999, 69999, 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=60', '{}'::jsonb),
  ('ec-item-2', 'ec-order-1', 'ec-prod-6', 'ec-var-6-1', 'Women Ethnic Maxi Dress', 'WEM-M-M', 1, 1699, 1699, 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&w=600&q=60', '{"size":"M","color":"Maroon"}'::jsonb),
  ('ec-item-3', 'ec-order-2', 'ec-prod-2', 'ec-var-2-2', 'Apple MacBook Air M2', 'MBA-M2-16GB-512', 1, 119900, 119900, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=60', '{"ram":"16GB","storage":"512GB","color":"Midnight"}'::jsonb),
  ('ec-item-4', 'ec-order-3', 'ec-prod-3', 'ec-var-3-1', 'Nike Air Zoom Running Shoe', 'NAZ-M-9', 1, 4395, 4395, 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=60', '{"size":"UK 9","color":"Black"}'::jsonb)
) AS t(id, order_id, product_id, variant_id, product_name, sku, quantity, unit_price, total, image, attributes)
WHERE NOT EXISTS (SELECT 1 FROM public.ec_order_items LIMIT 1);

