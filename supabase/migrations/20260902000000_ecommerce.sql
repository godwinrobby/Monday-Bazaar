-- Migration: E-commerce module (Admin + User App)
-- Schema part 1: tables (products, variants, categories, brands, coupons,
-- payments, shipping, orders, order_items) + RLS. Idempotent.

-- Categories -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    parent_id TEXT,
    image TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Brands ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_brands (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    logo TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Products (simple + variable) ------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE,
    product_type TEXT NOT NULL DEFAULT 'simple', -- simple | variable
    description TEXT,
    brand_id TEXT,
    category_id TEXT,
    price NUMERIC DEFAULT 0,
    sale_price NUMERIC,
    sku TEXT,
    stock INT DEFAULT 0,
    images JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants -------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT,
    price NUMERIC DEFAULT 0,
    sale_price NUMERIC,
    stock INT DEFAULT 0,
    attributes JSONB DEFAULT '{}'::jsonb,
    image TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Coupons ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE,
    type TEXT NOT NULL DEFAULT 'percent', -- percent | fixed
    value NUMERIC DEFAULT 0,
    min_order NUMERIC DEFAULT 0,
    max_discount NUMERIC,
    usage_limit INT DEFAULT 0,
    used INT DEFAULT 0,
    starts_at TIMESTAMP WITH TIME ZONE,
    ends_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
-- Payment methods ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_payment_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- Shipping methods ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_shipping_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    charge NUMERIC DEFAULT 0,
    min_order_free NUMERIC DEFAULT 0,
    estimated_days TEXT,
    enabled BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0
);

-- Orders -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'pending', -- pending | confirmed | shipped | delivered | cancelled
    payment_method TEXT,
    payment_status TEXT NOT NULL DEFAULT 'pending', -- pending | paid | failed | refunded
    shipping_method TEXT,
    shipping_charge NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    discount NUMERIC DEFAULT 0,
    coupon_code TEXT,
    total NUMERIC DEFAULT 0,
    tracking_number TEXT,
    tracking_company TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT,
    variant_id TEXT,
    product_name TEXT,
    sku TEXT,
    quantity INT DEFAULT 1,
    unit_price NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    image TEXT,
    attributes JSONB DEFAULT '{}'::jsonb
);

-- RLS off (permissive, matching app convention) -------------------------------
ALTER TABLE public.ec_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_payment_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_shipping_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ec_order_items DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.ec_categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_brands TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_products TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_variants TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_coupons TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_payment_methods TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_shipping_methods TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_orders TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.ec_order_items TO anon, authenticated, service_role;

