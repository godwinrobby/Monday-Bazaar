-- Migration: Add stock details columns to ec_products and ec_variants
-- Adds low_stock_threshold and stock_status for WooCommerce-style stock management.
-- Idempotent.

ALTER TABLE public.ec_products  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 2;
ALTER TABLE public.ec_products  ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'instock';
ALTER TABLE public.ec_variants  ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 2;
ALTER TABLE public.ec_variants  ADD COLUMN IF NOT EXISTS stock_status TEXT DEFAULT 'instock';
