-- Migration: Customer accounts & auth (User App) + Customer Management (Admin)
-- Adds ec_customers table (hashed passwords only) and links orders to customers.
-- Idempotent.

-- Customers ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ec_customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active | inactive | blocked
    address JSONB DEFAULT '{}'::jsonb,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Link orders to customers (optional FK-friendly column)
ALTER TABLE public.ec_orders ADD COLUMN IF NOT EXISTS customer_id TEXT;

-- RLS off (permissive, matching app convention)
ALTER TABLE public.ec_customers DISABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE public.ec_customers TO anon, authenticated, service_role;
