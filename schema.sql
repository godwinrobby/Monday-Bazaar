-- Supabase / PostgreSQL Database Schema for Monday Bazaar

-- 1. Create deals table
CREATE TABLE IF NOT EXISTS public.deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    store TEXT,
    category TEXT,
    originalprice NUMERIC,
    dealprice NUMERIC,
    discountpercentage NUMERIC,
    couponcode TEXT,
    imageurl TEXT,
    dealurl TEXT,
    islootdeal BOOLEAN DEFAULT false,
    isverified BOOLEAN DEFAULT true,
    isactive BOOLEAN DEFAULT true,
    upvotes INT DEFAULT 0,
    downvotes INT DEFAULT 0,
    aiscore INT DEFAULT 85,
    aiverdict TEXT,
    aipros JSONB DEFAULT '[]'::jsonb,
    aicons JSONB DEFAULT '[]'::jsonb,
    postedat TEXT,
    postedby TEXT,
    viewscount INT DEFAULT 0,
    commentscount INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    email TEXT,
    password TEXT,
    role TEXT DEFAULT 'user',
    avatarurl TEXT,
    dealsposted INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create affiliate_configs table
CREATE TABLE IF NOT EXISTS public.affiliate_configs (
    store_key TEXT PRIMARY KEY,
    store_name TEXT,
    tag TEXT,
    parameter_name TEXT,
    commission_rate NUMERIC DEFAULT 5.0,
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create site_config table
CREATE TABLE IF NOT EXISTS public.site_config (
    config_key TEXT PRIMARY KEY,
    config_value JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create link_clicks table
CREATE TABLE IF NOT EXISTS public.link_clicks (
    id BIGSERIAL PRIMARY KEY,
    deal_id TEXT,
    deal_title TEXT,
    store TEXT,
    affiliate_url TEXT,
    user_id TEXT,
    ip_address TEXT,
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create deal_views table
CREATE TABLE IF NOT EXISTS public.deal_views (
    id BIGSERIAL PRIMARY KEY,
    deal_id TEXT,
    user_id TEXT,
    ip_address TEXT,
    viewedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable Row Level Security (RLS) for public access
ALTER TABLE public.deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_views DISABLE ROW LEVEL SECURITY;

-- Grant full access to anon, authenticated, and service_role
GRANT ALL ON TABLE public.deals TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.affiliate_configs TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.site_config TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.link_clicks TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.deal_views TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- Public permissive policies (in case RLS is re-enabled)
DO $$ 
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on deals" ON public.deals';
    EXECUTE 'CREATE POLICY "Allow public all on deals" ON public.deals FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on users" ON public.users';
    EXECUTE 'CREATE POLICY "Allow public all on users" ON public.users FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on affiliate_configs" ON public.affiliate_configs';
    EXECUTE 'CREATE POLICY "Allow public all on affiliate_configs" ON public.affiliate_configs FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on site_config" ON public.site_config';
    EXECUTE 'CREATE POLICY "Allow public all on site_config" ON public.site_config FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on link_clicks" ON public.link_clicks';
    EXECUTE 'CREATE POLICY "Allow public all on link_clicks" ON public.link_clicks FOR ALL USING (true) WITH CHECK (true)';

    EXECUTE 'DROP POLICY IF EXISTS "Allow public all on deal_views" ON public.deal_views';
    EXECUTE 'CREATE POLICY "Allow public all on deal_views" ON public.deal_views FOR ALL USING (true) WITH CHECK (true)';
END $$;
