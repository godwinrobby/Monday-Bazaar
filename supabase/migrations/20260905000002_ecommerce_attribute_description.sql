-- Migration: Add description column to ec_attributes (WooCommerce-style attribute notes)
-- Idempotent.
ALTER TABLE public.ec_attributes ADD COLUMN IF NOT EXISTS description TEXT;
