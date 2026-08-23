import React, { useState, useEffect } from 'react';
import { Deal, StoreName, CategoryName } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { 
  StoreAffiliateConfig, 
  DEFAULT_AFFILIATE_CONFIGS, 
  buildAffiliateUrl 
} from '../utils/affiliate';
import { 
  LayoutDashboard, 
  Tag, 
  Link2, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  TrendingUp, 
  ShieldAlert, 
  Flame, 
  Sparkles, 
  DollarSign, 
  Eye, 
  ArrowLeft, 
  Search, 
  Settings, 
  Copy, 
  Check, 
  RefreshCw, 
  Store, 
  Filter, 
  Layers, 
  HelpCircle,
  FileSpreadsheet,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  ShoppingBag,
  Database,
  Share2,
  Send,
  LogOut,
  KeyRound,
  Lock,
  User
} from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { AmazonAffiliateImporter } from './AmazonAffiliateImporter';
import { SocialAutoPoster } from './SocialAutoPoster';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { ToastContainer, ToastMessage } from './Toast';
import { parseDealsCSV, DealCSVRow } from '../utils/csvImport';

interface AdminDashboardProps {
  deals: Deal[];
  onAddDeal: (newDeal: Deal) => Promise<{ success: boolean; error?: string }> | void;
  onUpdateDeal: (updatedDeal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onCloseAdmin: () => void;
  adminUser?: any;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  onCloseAdmin,
  adminUser,
  onLogout,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTab = location.pathname.split('/').pop() || 'overview';

  // Store Status State (open/closed per store)
  const [storeStatuses, setStoreStatuses] = useState<Record<StoreName, 'open' | 'closed'>>(() => {
    const saved = localStorage.getItem('storeStatuses');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const initial: Record<StoreName, 'open' | 'closed'> = {} as any;
    (Object.keys(STORES_INFO) as StoreName[]).forEach(s => {
      initial[s] = 'open';
    });
    return initial;
  });

  // Affiliate Config State with Node.js Backend Database Persistence
  const [affiliateConfigs, setAffiliateConfigs] = useState<Record<StoreName, StoreAffiliateConfig>>(DEFAULT_AFFILIATE_CONFIGS);

  // Load affiliate configs from database
  useEffect(() => {
    fetch('/api/affiliate-configs')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.configs) {
          setAffiliateConfigs(data.configs);
        }
      })
      .catch(err => console.log('Failed fetching affiliate configs from DB:', err));
  }, []);

  const handleSaveAffiliateConfigs = (newConfigs: Record<StoreName, StoreAffiliateConfig>) => {
    setAffiliateConfigs(newConfigs);
    fetch('/api/affiliate-configs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConfigs)
    }).catch(err => console.error('Failed syncing affiliate configs to DB:', err));
  };

  // Site Banner Settings from Database
  const [siteBanner, setSiteBanner] = useState({
    enabled: true,
    text: '🔥 Monday Bazaar Super Sale is LIVE! Grab exclusive coupons & loot deals across Amazon, Flipkart & Myntra.',
    badge: 'FLASH LOOT SALE'
  });

  // CSV Import State
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<DealCSVRow[] | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvImporting, setCsvImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState<string>('');

  const downloadCsvTemplate = () => {
    const headers = [
      'title','description','store','category','originalPrice','dealPrice','discountPercentage',
      'couponCode','imageUrl','dealUrl','isLootDeal','isVerified','isExpiringSoon','isActive',
      'upvotes','downvotes','userVoted','aiScore','aiVerdict','aiPros','aiCons','postedAt',
      'expiryDate','priceHistory','commentsCount','comments','viewsCount','postedBy'
    ];
    
    const sampleRows = [
      {
        title: 'Roadster Men Lightweight Solid Puffer Jacket',
        description: 'Men Navy Blue Solid Puffer Jacket with mock collar, two pockets, zip closure, and warm thermal padding.',
        store: 'Myntra',
        category: 'Fashion & Apparel',
        originalPrice: 3999,
        dealPrice: 1199,
        discountPercentage: 70,
        couponCode: 'MYNTRA200',
        imageUrl: 'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        dealUrl: 'https://www.myntra.com/jackets/roadster/navy-puffer-jacket/12345',
        isLootDeal: true,
        isVerified: true,
        isExpiringSoon: false,
        isActive: true,
        upvotes: 198,
        downvotes: 6,
        userVoted: '',
        aiScore: 89,
        aiVerdict: 'Steal fashion deal on Myntra with 70% direct price reduction.',
        aiPros: '70% discount off MRP|Premium water-resistant material|Stylish slim fit',
        aiCons: 'Limited size options left',
        postedAt: '5 hours ago',
        expiryDate: '',
        priceHistory: '2026-08-18:3999|2026-08-23:1199',
        commentsCount: 12,
        comments: '',
        viewsCount: 1420,
        postedBy: 'StyleBlogger'
      },
      {
        title: 'Apple iPhone 15 128GB',
        description: 'iPhone 15 with Dynamic Island, 48MP camera, USB-C, and all-day battery life.',
        store: 'Apple',
        category: 'Mobiles & Tablets',
        originalPrice: 59999,
        dealPrice: 47999,
        discountPercentage: 20,
        couponCode: '',
        imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
        dealUrl: 'https://www.apple.com/in/iphone-15/',
        isLootDeal: false,
        isVerified: true,
        isExpiringSoon: false,
        isActive: true,
        upvotes: 856,
        downvotes: 23,
        userVoted: '',
        aiScore: 92,
        aiVerdict: 'Lowest online price ever for iPhone 15 with bank discounts.',
        aiPros: 'SuperRetina XDR display|A16 Bionic chip|USB-C charging|5G capable',
        aiCons: 'No charger in box|Standard 60Hz display',
        postedAt: '12 mins ago',
        expiryDate: '',
        priceHistory: '2026-08-20:59999|2026-08-23:47999',
        commentsCount: 45,
        comments: '',
        viewsCount: 3420,
        postedBy: 'DealMaster_Pro'
      },
      {
        title: 'Sony WH-1000XM5 Wireless Headphones',
        description: 'Industry leading noise canceling with Auto NC Optimizer, 8 mics for crisp calls, and 30hr battery.',
        store: 'Amazon',
        category: 'Audio & Headphones',
        originalPrice: 26990,
        dealPrice: 19990,
        discountPercentage: 26,
        couponCode: '',
        imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?auto=format&fit=crop&w=800&q=80',
        dealUrl: 'https://www.amazon.in/dp/B09XS7JWHH',
        isLootDeal: false,
        isVerified: true,
        isExpiringSoon: false,
        isActive: true,
        upvotes: 534,
        downvotes: 12,
        userVoted: '',
        aiScore: 88,
        aiVerdict: 'Excellent ANC headphones at a historic low price on Amazon.',
        aiPros: 'Best-in-class noise cancellation|30-hour battery|Multipoint connection|LDAC Hi-Res Audio',
        aiCons: 'Earcups may run warm after long use',
        postedAt: '2 hours ago',
        expiryDate: '',
        priceHistory: '2026-08-21:26990|2026-08-23:19990',
        commentsCount: 28,
        comments: '',
        viewsCount: 1890,
        postedBy: 'AudioPhile'
      }
    ];

    const escapeCsv = (val: any): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCsv).join(','),
      ...sampleRows.map(row => headers.map(h => escapeCsv(row[h as keyof typeof row] ?? '')).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'deals-import-template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    setCsvError(null);
    setCsvPreview(null);
    setCsvProgress('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const deals = parseDealsCSV(text);
        if (deals.length === 0) {
          setCsvError('No valid deals found in CSV. Check the format.');
        } else {
          setCsvPreview(deals);
          setCsvProgress(`Found ${deals.length} deals ready to import.`);
        }
      } catch (err) {
        setCsvError('Failed to parse CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleCsvImport = async () => {
    if (!csvPreview || csvPreview.length === 0) return;
    
    setCsvImporting(true);
    setCsvProgress('');
    
    try {
      let successCount = 0;
      let errorCount = 0;
      
      for (const deal of csvPreview) {
        try {
          await onAddDeal({
            ...deal,
            id: `deal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            priceHistory: deal.priceHistory.length > 0 ? deal.priceHistory : [{ date: 'Previous', price: deal.originalPrice }, { date: 'Today', price: deal.dealPrice }],
            comments: deal.comments || [],
          });
          successCount++;
          setCsvProgress(`Imported ${successCount} of ${csvPreview.length} deals...`);
        } catch (err) {
          errorCount++;
        }
      }
      
      addToast({
        type: 'success',
        title: 'CSV Import Complete',
        message: `Successfully imported ${successCount} deals.${errorCount > 0 ? ` Failed: ${errorCount}.` : ''}`
      });
      
      setCsvFile(null);
      setCsvPreview(null);
      setCsvProgress('');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Import Failed',
        message: 'An error occurred during CSV import.'
      });
    } finally {
      setCsvImporting(false);
    }
  };

  // Password Change State
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passChangeMsg, setPassChangeMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser?.id) return;
    setIsUpdatingPass(true);
    setPassChangeMsg(null);

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: adminUser.id,
          currentPassword: currPass,
          newPassword: newPass
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPassChangeMsg({ type: 'success', text: 'Admin password updated successfully in database!' });
        setCurrPass('');
        setNewPass('');
      } else {
        setPassChangeMsg({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch (err: any) {
      setPassChangeMsg({ type: 'error', text: 'Network error updating password.' });
    } finally {
      setIsUpdatingPass(false);
    }
  };

  useEffect(() => {
    fetch('/api/site-banner')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.banner) {
          setSiteBanner(data.banner);
        }
      })
      .catch(err => console.log('Failed fetching site banner from DB:', err));
  }, []);

  const handleSaveSiteBanner = (newBanner: typeof siteBanner) => {
    setSiteBanner(newBanner);
    fetch('/api/site-banner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newBanner)
    }).catch(err => console.error('Failed syncing site banner to DB:', err));
  };

  // Supabase Database Status State & Entity Collections
  const [dbInfo, setDbInfo] = useState<{
    engine?: string;
    isConnected?: boolean;
    host?: string;
    database?: string;
    tables?: string[];
    error?: string;
  }>({});
  const [dbUsersCount, setDbUsersCount] = useState<number>(0);
  const [dbClicksCount, setDbClicksCount] = useState<number>(0);
  const [dbViewsCount, setDbViewsCount] = useState<number>(0);
  const [recentUsersList, setRecentUsersList] = useState<any[]>([]);
  const [recentClicksList, setRecentClicksList] = useState<any[]>([]);

  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Sitemap Generator State
  const [isGeneratingSitemap, setIsGeneratingSitemap] = useState(false);
  const [sitemapResult, setSitemapResult] = useState<{ message: string; urlCount: number; sitemapUrl: string; xml: string } | null>(null);
  const [showSitemapXml, setShowSitemapXml] = useState(false);

  const handleGenerateSitemap = async () => {
    setIsGeneratingSitemap(true);
    setSitemapResult(null);
    try {
      const baseUrl = window.location.origin;
      const allDeals = deals;

      const staticUrls = [
        { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'hourly' },
        { loc: `${baseUrl}/loot`, priority: '0.9', changefreq: 'hourly' },
        { loc: `${baseUrl}/categories`, priority: '0.8', changefreq: 'daily' },
        { loc: `${baseUrl}/stores`, priority: '0.8', changefreq: 'daily' },
      ];

      const stores = [...new Set(allDeals.map(d => d.store).filter((s): s is string => Boolean(s)))];
      const categories = [...new Set(allDeals.map(d => d.category).filter((c): c is string => Boolean(c)))];

      const storeUrls = stores.map((s) => ({
        loc: `${baseUrl}/store/${encodeURIComponent(s as string)}`,
        priority: '0.7',
        changefreq: 'daily'
      }));

      const categoryUrls = categories.map((c) => ({
        loc: `${baseUrl}/category/${encodeURIComponent(c as string)}`,
        priority: '0.7',
        changefreq: 'daily'
      }));

      const dealUrls = allDeals.map(d => ({
        loc: `${baseUrl}/deal/${encodeURIComponent(d.id)}`,
        priority: '0.6',
        changefreq: 'daily',
        lastmod: d.createdAt || d.postedAt ? new Date(d.createdAt || d.postedAt).toISOString().split('T')[0] : undefined
      }));

      const allUrls = [...staticUrls, ...storeUrls, ...categoryUrls, ...dealUrls];

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
${u.lastmod ? `    <lastmod>${u.lastmod}</lastmod>\n` : ''}  </url>`).join('\n')}
</urlset>`;

      const blob = new Blob([xml], { type: 'application/xml' });
      const sitemapUrl = URL.createObjectURL(blob);

      setSitemapResult({
        message: `Sitemap generated successfully with ${allUrls.length} URLs!`,
        urlCount: allUrls.length,
        sitemapUrl,
        xml
      });
    } catch (err: any) {
      setSitemapResult({
        message: `Sitemap generation error: ${err.message}`,
        urlCount: 0,
        sitemapUrl: '',
        xml: ''
      });
    } finally {
      setIsGeneratingSitemap(false);
    }
  };

  const supabaseSqlSchema = `-- 1. Create deals table
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

-- Fallback permissive RLS policies
DROP POLICY IF EXISTS "Public deals access" ON public.deals;
CREATE POLICY "Public deals access" ON public.deals FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public users access" ON public.users;
CREATE POLICY "Public users access" ON public.users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public affiliate_configs access" ON public.affiliate_configs;
CREATE POLICY "Public affiliate_configs access" ON public.affiliate_configs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public site_config access" ON public.site_config;
CREATE POLICY "Public site_config access" ON public.site_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public link_clicks access" ON public.link_clicks;
CREATE POLICY "Public link_clicks access" ON public.link_clicks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public deal_views access" ON public.deal_views;
CREATE POLICY "Public deal_views access" ON public.deal_views FOR ALL USING (true) WITH CHECK (true);`;

  const fetchDbData = async () => {
    try {
      // 1. Fetch DB Status
      const resStatus = await fetch('/api/db-status');
      const jsonStatus = await resStatus.json();
      if (jsonStatus.success && jsonStatus.db) {
        setDbInfo(jsonStatus.db);
      }

      // 2. Fetch Users
      const resUsers = await fetch('/api/users');
      const jsonUsers = await resUsers.json();
      if (jsonUsers.success && jsonUsers.users) {
        setDbUsersCount(jsonUsers.count || jsonUsers.users.length);
        setRecentUsersList(jsonUsers.users.slice(0, 5));
      }

      // 3. Fetch Link Clicks
      const resClicks = await fetch('/api/clicks');
      const jsonClicks = await resClicks.json();
      if (jsonClicks.success && jsonClicks.clicks) {
        setDbClicksCount(jsonClicks.count || jsonClicks.clicks.length);
        setRecentClicksList(jsonClicks.clicks.slice(0, 5));
      }

      // 4. Fetch Deal Views
      const resViews = await fetch('/api/views');
      const jsonViews = await resViews.json();
      if (jsonViews.success && jsonViews.views) {
        setDbViewsCount(jsonViews.count || jsonViews.views.length);
      }
    } catch (err) {
      console.warn('Failed fetching DB status and entity metrics:', err);
    }
  };

  const handleMigrateToSupabase = async () => {
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await fetch('/api/migrate-to-supabase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      if (json.message) {
        setMigrationResult(json.message);
      } else {
        setMigrationResult('All Users, Deals, and Store Configs synced successfully into Supabase database!');
      }
      fetchDbData();
    } catch (err: any) {
      setMigrationResult(`Supabase Migration error: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  useEffect(() => {
    fetchDbData();
  }, []);

  // Deal Form Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [dealModalError, setDealModalError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleConfirmDeleteDeal = (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    onDeleteDeal(dealId);
    addToast({
      type: 'success',
      title: 'Deal Deleted Successfully',
      message: targetDeal ? `"${targetDeal.title}" has been permanently removed.` : 'Deal was removed from database.'
    });
  };

  // Search & Filter State inside Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [lootOnly, setLootOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [couponOnly, setCouponOnly] = useState(false);
  const [minDiscount, setMinDiscount] = useState<number>(0);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, storeFilter, categoryFilter, statusFilter, lootOnly, verifiedOnly, couponOnly, minDiscount]);

  // Affiliate Tester Tool State
  const [testUrlInput, setTestUrlInput] = useState('https://www.amazon.in/dp/B09XS7JWHH');
  const [testStoreSelect, setTestStoreSelect] = useState<StoreName>('Amazon');
  const [generatedAffiliateUrl, setGeneratedAffiliateUrl] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State for Add / Edit Deal
  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    description: '',
    store: 'Amazon',
    category: 'Mobiles & Tablets',
    originalPrice: 9999,
    dealPrice: 4999,
    couponCode: '',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
    dealUrl: '',
    isLootDeal: true,
    isVerified: true,
    isActive: true,
    aiScore: 90,
    aiVerdict: 'Verified high-discount offer with solid price drop history.',
    aiPros: ['Great savings compared to standard MRP', 'Verified merchant deal'],
    aiCons: ['Limited stock offer'],
    postedBy: 'Admin_Master',
  });

  // Open Add Deal Modal
  const handleOpenAddModal = () => {
    setEditingDeal(null);
    setDealModalError(null);
    setFormData({
      title: '',
      description: '',
      store: 'Amazon',
      category: 'Mobiles & Tablets',
      originalPrice: 9999,
      dealPrice: 4999,
      couponCode: '',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      dealUrl: 'https://www.amazon.in/dp/example',
      isLootDeal: true,
      isVerified: true,
      isActive: true,
      aiScore: 90,
      aiVerdict: 'Verified high-discount offer with solid price drop history.',
      aiPros: ['Great savings compared to standard MRP', 'Verified merchant deal'],
      aiCons: ['Limited stock offer'],
      postedBy: 'Admin_Master',
    });
    setIsDealModalOpen(true);
  };

  // Open Edit Deal Modal
  const handleOpenEditModal = (deal: Deal) => {
    setEditingDeal(deal);
    setDealModalError(null);
    setFormData({ ...deal, isActive: deal.isActive !== false });
    setIsDealModalOpen(true);
  };

  // Save Deal Form
  const handleSaveDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    setDealModalError(null);
    if (!formData.title || !formData.dealUrl || !formData.dealPrice) {
      setDealModalError('Please fill in title, deal price, and valid deal URL');
      return;
    }

    const origPrice = Number(formData.originalPrice) || Number(formData.dealPrice);
    const dealPriceNum = Number(formData.dealPrice);
    const discountPct = origPrice > dealPriceNum ? Math.round(((origPrice - dealPriceNum) / origPrice) * 100) : 0;

    if (editingDeal) {
      const updated: Deal = {
        ...editingDeal,
        ...formData,
        title: formData.title || editingDeal.title,
        description: formData.description || editingDeal.description,
        store: (formData.store as StoreName) || editingDeal.store,
        category: (formData.category as CategoryName) || editingDeal.category,
        originalPrice: origPrice,
        dealPrice: dealPriceNum,
        discountPercentage: discountPct,
        couponCode: formData.couponCode?.trim() || undefined,
        imageUrl: formData.imageUrl || editingDeal.imageUrl,
        dealUrl: formData.dealUrl || editingDeal.dealUrl,
        isLootDeal: !!formData.isLootDeal,
        isVerified: !!formData.isVerified,
        isActive: formData.isActive !== false,
        aiScore: Number(formData.aiScore) || 85,
        aiVerdict: formData.aiVerdict || 'Verified deal',
      };
      onUpdateDeal(updated);
      addToast({
        type: 'success',
        title: 'Deal Updated',
        message: `Successfully updated deal "${updated.title}"`
      });
      setIsDealModalOpen(false);
    } else {
      const newDeal: Deal = {
        id: `deal-${Date.now()}`,
        title: formData.title || 'New Bargain Offer',
        description: formData.description || 'Exclusive deal verified by Monday Bazaar Admin.',
        store: (formData.store as StoreName) || 'Amazon',
        category: (formData.category as CategoryName) || 'Mobiles & Tablets',
        originalPrice: origPrice,
        dealPrice: dealPriceNum,
        discountPercentage: discountPct,
        couponCode: formData.couponCode?.trim() || undefined,
        imageUrl: formData.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
        dealUrl: formData.dealUrl || 'https://www.amazon.in',
        isLootDeal: discountPct >= 40 || !!formData.isLootDeal,
        isVerified: true,
        isActive: formData.isActive !== false,
        upvotes: 25,
        downvotes: 0,
        aiScore: Number(formData.aiScore) || 90,
        aiVerdict: formData.aiVerdict || 'Verified offer added by admin.',
        aiPros: formData.aiPros || ['Verified merchant link', 'Immediate savings'],
        aiCons: formData.aiCons || ['Check stock availability'],
        postedAt: 'Just now',
        createdAt: new Date().toISOString(),
        priceHistory: [
          { date: 'Previous', price: origPrice },
          { date: 'Today', price: dealPriceNum },
        ],
        commentsCount: 0,
        comments: [],
        viewsCount: 150,
        postedBy: 'Admin_Master',
      };

      const res = await onAddDeal(newDeal);
      if (res && !res.success) {
        setDealModalError(res.error || 'Duplicate Deal Error: A deal with this title or link already exists.');
        addToast({
          type: 'error',
          title: 'Duplicate Deal Blocked',
          message: res.error || 'A deal with this title or link already exists in the database!'
        });
      } else {
        addToast({
          type: 'success',
          title: 'Deal Published',
          message: `Successfully added new deal "${newDeal.title}"`
        });
        setIsDealModalOpen(false);
      }
    }
  };

  // Test Affiliate Converter
  const handleTestConvert = () => {
    const transformed = buildAffiliateUrl(testUrlInput, testStoreSelect, affiliateConfigs);
    setGeneratedAffiliateUrl(transformed);
  };

  // Copy Generated URL
  const handleCopyGenerated = () => {
    navigator.clipboard.writeText(generatedAffiliateUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Update Affiliate Config
  const handleUpdateAffiliateRule = (store: StoreName, field: keyof StoreAffiliateConfig, value: any) => {
    setAffiliateConfigs(prev => ({
      ...prev,
      [store]: {
        ...prev[store],
        [field]: value
      }
    }));
  };

  // Update Store Status
  const handleUpdateStoreStatus = (store: StoreName, status: 'open' | 'closed') => {
    setStoreStatuses(prev => {
      const next = { ...prev, [store]: status };
      localStorage.setItem('storeStatuses', JSON.stringify(next));
      return next;
    });
  };

  // Auto Fetch Link Details (Title, Prices, Affiliate URL)
  const [isAnalyzingLink, setIsAnalyzingLink] = useState(false);

  const handleAutoFetchLink = async () => {
    if (!formData.dealUrl || !formData.dealUrl.trim()) {
      alert('Please enter a product deal URL first (e.g. https://link.amazon/B0fBQlm3o)');
      return;
    }

    setIsAnalyzingLink(true);
    try {
      const res = await fetch('/api/analyze-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrText: formData.dealUrl })
      });
      const data = await res.json();
      if (data.success && data.data) {
        const d = data.data;
        const storeName = (d.store as StoreName) || formData.store || 'Amazon';
        const convertedUrl = buildAffiliateUrl(formData.dealUrl, storeName, affiliateConfigs);

        setFormData(prev => ({
          ...prev,
          title: d.title || prev.title,
          store: storeName,
          category: (d.category as CategoryName) || prev.category,
          originalPrice: d.originalPrice || prev.originalPrice,
          dealPrice: d.dealPrice || prev.dealPrice,
          couponCode: d.couponCode || prev.couponCode,
          imageUrl: d.imageUrl || prev.imageUrl,
          dealUrl: convertedUrl,
          aiScore: d.aiScore || prev.aiScore,
          aiVerdict: d.aiVerdict || prev.aiVerdict,
          aiPros: d.aiPros || prev.aiPros,
          aiCons: d.aiCons || prev.aiCons,
          isLootDeal: d.isLootDeal ?? prev.isLootDeal,
        }));
      }
    } catch (err) {
      console.error('Failed to auto fetch deal details:', err);
    } finally {
      setIsAnalyzingLink(false);
    }
  };

  // Filtered deals in admin table
  const filteredAdminDeals = deals.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = storeFilter === 'All' || d.store === storeFilter;
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && d.isActive !== false) ||
                          (statusFilter === 'Inactive' && d.isActive === false);
    const matchesLoot = !lootOnly || d.isLootDeal;
    const matchesVerified = !verifiedOnly || d.isVerified;
    const matchesCoupon = !couponOnly || !!d.couponCode;
    const matchesDiscount = d.discountPercentage >= minDiscount;
    return matchesSearch && matchesStore && matchesCategory && matchesStatus && matchesLoot && matchesVerified && matchesCoupon && matchesDiscount;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAdminDeals.length / pageSize));
  const paginatedDeals = filteredAdminDeals.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Calculate Metrics (Counts only Active deals for public-facing metrics)
  const activeDeals = deals.filter(d => d.isActive !== false);
  const inactiveDeals = deals.filter(d => d.isActive === false);
  const totalDealsCount = activeDeals.length;
  const totalCatalogDealsCount = deals.length;
  const totalLootDealsCount = deals.filter(d => d.isLootDeal && d.isActive !== false).length;
  const totalVerifiedCount = deals.filter(d => d.isVerified && d.isActive !== false).length;
  const totalViewsSum = deals.reduce((sum, d) => sum + (d.viewsCount || 0), 0);
  
  // Calculate Estimated Monthly Affiliate Revenue Potential
  const estRevenue = deals.reduce((sum, d) => {
    const storeRule = affiliateConfigs[d.store];
    const rate = storeRule ? storeRule.commissionRate : 5.0;
    const clicks = d.viewsCount || 50;
    const estConversions = clicks * 0.03; // 3% conversion assumption
    return sum + (estConversions * d.dealPrice * (rate / 100));
  }, 0);

  return (
    <div id="admin-management-console" className="min-h-screen bg-slate-100 text-slate-800 pb-16 flex flex-col lg:flex-row">
      
      {/* Sidebar Navigation */}
      <aside className="fixed top-0 left-0 w-60 h-screen bg-slate-900 text-white border-r border-slate-800 overflow-y-auto no-scrollbar z-30 hidden lg:block"><div className="flex flex-col h-full">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-600 rounded-xl text-white shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-tight text-white truncate">
                Monday Bazaar <span className="text-orange-500 font-bold">Admin</span>
              </h1>
              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[9px] uppercase rounded-md border border-emerald-500/30 inline-block mt-0.5">
                LIVE CONTROLS
              </span>
            </div>
          </div>
          {adminUser && (
            <div className="flex items-center gap-2 mt-3 px-2 py-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl text-xs text-slate-300">
              <img
                src={adminUser.avatarUrl || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80"}
                alt={adminUser.username}
                className="w-6 h-6 rounded-full object-cover border border-orange-500/50"
              />
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-bold text-white text-[10px] truncate">{adminUser.username}</span>
                <span className="text-[8px] text-emerald-400 font-extrabold uppercase">DB Admin</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Menu */}
        <nav className="p-3 space-y-1">
          <Link
            to="/admin/overview"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'overview'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            <span className="text-left">Dashboard & Analytics</span>
          </Link>

          <Link
            to="/admin/amazon-import"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'amazon-import'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <ShoppingBag className="w-4 h-4 shrink-0 text-amber-400" />
            <span className="text-left flex-1">Amazon Affiliate Fetcher</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-extrabold rounded text-[9px] shrink-0">Auto Import</span>
          </Link>

          <Link
            to="/admin/csv-import"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'csv-import'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-left flex-1">CSV Import</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] shrink-0">Bulk Upload</span>
          </Link>

          <Link
            to="/admin/deals"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'deals'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Tag className="w-4 h-4 shrink-0" />
            <span className="text-left">Deals Catalog ({deals.length})</span>
          </Link>

          <Link
            to="/admin/social-autopost"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'social-autopost'
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Share2 className="w-4 h-4 shrink-0 text-blue-400" />
            <span className="text-left flex-1">FB & IG Auto-Poster</span>
            <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 font-extrabold rounded text-[9px] shrink-0">Meta API</span>
          </Link>

          <Link
            to="/admin/affiliation"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'affiliation'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Link2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-left flex-1">Affiliation & Store Rules</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[9px] shrink-0">Active</span>
          </Link>

          <Link
            to="/admin/settings"
            className={`w-full px-3 py-2.5 font-bold text-xs flex items-center gap-2.5 rounded-xl transition-all ${
              currentTab === 'settings'
                ? 'bg-orange-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="text-left">Site Banners & Configuration</span>
          </Link>
        </nav>

        {/* Sidebar Footer Actions */}
        <div className="p-3 border-t border-slate-800 space-y-2 mt-auto">
          <button
            onClick={handleOpenAddModal}
            id="admin-add-deal-btn"
            className="w-full px-3 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Deal</span>
          </button>

          <button
            onClick={onCloseAdmin}
            id="back-to-storefront-btn"
            className="w-full px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-orange-400" />
            <span>Storefront</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              id="admin-logout-btn"
              title="Sign out of Admin Portal"
              className="w-full px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 font-bold text-xs rounded-xl border border-red-500/30 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
      </aside>

      {/* Mobile Top Header (visible on smaller screens) */}
      <div className="lg:hidden bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md w-full">
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-orange-600 rounded-lg text-white shadow-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white">
                Monday Bazaar <span className="text-orange-500 font-bold">Admin</span>
              </h1>
              <p className="text-[9px] text-slate-400">Deals, Affiliation & Catalog Management</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleOpenAddModal}
              className="px-2.5 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold text-[10px] rounded-lg flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Deal</span>
            </button>
            <button
              onClick={onCloseAdmin}
              className="px-2.5 py-1.5 bg-slate-800 text-slate-200 font-bold text-[10px] rounded-lg border border-slate-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3 text-orange-400" />
              <span>Store</span>
            </button>
            {onLogout && (
              <button
                onClick={onLogout}
                className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-[10px] rounded-lg border border-red-500/30 flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Logout</span>
              </button>
            )}
          </div>
        </div>
        {/* Mobile Horizontal Scroll Menu */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 px-2 py-1.5">
          <Link
            to="/admin/overview"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'overview' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard className="w-3 h-3" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/admin/amazon-import"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'amazon-import' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShoppingBag className="w-3 h-3" />
            <span>Amazon Importer</span>
          </Link>
          <Link
            to="/admin/deals"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'deals' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>Deals ({deals.length})</span>
          </Link>
          <Link
            to="/admin/social-autopost"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'social-autopost' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Share2 className="w-3 h-3" />
            <span>Auto-Poster</span>
          </Link>
          <Link
            to="/admin/affiliation"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'affiliation' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Link2 className="w-3 h-3" />
            <span>Affiliation</span>
          </Link>
          <Link
            to="/admin/settings"
            className={`px-3 py-1.5 font-bold text-[10px] flex items-center gap-1.5 rounded-lg whitespace-nowrap ${
              currentTab === 'settings' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </Link>
        </div>
      </div>

      {/* Main Content Area (full width next to sidebar) */}
      <div className="flex-1 min-w-0 lg:ml-60">
        {/* Main Admin Tab Body */}
        <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-8 max-w-full">
        
        {/* ==================== TAB 1: OVERVIEW & ANALYTICS ==================== */}
        {currentTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total Active Deals</span>
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                    <Tag className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-slate-900">{totalDealsCount}</p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    {totalVerifiedCount} Verified
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Across 11 major Indian e-commerce stores</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Est. Monthly Commission</span>
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-slate-900">
                    ₹{Math.round(estRevenue).toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                    Est. Potential
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">Calculated from click volume & affiliate tags</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Loot Deals Ratio</span>
                  <div className="p-2 bg-red-100 text-red-600 rounded-xl">
                    <Flame className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-slate-900">{totalLootDealsCount}</p>
                  <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">
                    {Math.round((totalLootDealsCount / totalDealsCount) * 100)}% of Total
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">High discount price drops (&gt;40% off)</p>
              </div>

              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="text-xs font-bold uppercase tracking-wider">Total User Impression Views</span>
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                    <Eye className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <p className="text-3xl font-black text-slate-900">
                    {totalViewsSum.toLocaleString('en-IN')}
                  </p>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg">
                    Live Feed
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">User deal views and click interactions</p>
              </div>
            </div>

            {/* Database & Entity Storage Migration Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-600/20 text-orange-400 border border-orange-500/30 rounded-2xl">
                    <Database className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-lg text-white">Database Migration & Entity Tracking</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        dbInfo.isConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {dbInfo.engine || 'Node.js Persistent Database Engine'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Sync and persist Users, Deals, Link Clicks, Views, and Affiliate Configs into Supabase database.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleMigrateToSupabase}
                  disabled={isMigrating}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isMigrating ? 'animate-spin' : ''}`} />
                  <span>{isMigrating ? 'Migrating All Entities...' : 'Migrate All Data Into Database'}</span>
                </button>
              </div>

              {migrationResult && (
                <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{migrationResult}</span>
                </div>
              )}

              {/* Entity Count Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Users Stored</p>
                  <p className="text-2xl font-black text-amber-400">{dbUsersCount}</p>
                  <p className="text-[10px] text-slate-400">User accounts in DB</p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deals Stored</p>
                  <p className="text-2xl font-black text-orange-400">{totalDealsCount}</p>
                  <p className="text-[10px] text-slate-400">Catalog items in DB</p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Link Clicks Tracked</p>
                  <p className="text-2xl font-black text-emerald-400">{dbClicksCount}</p>
                  <p className="text-[10px] text-slate-400">Outbound link clicks in DB</p>
                </div>

                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 space-y-1">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Deal Views Logged</p>
                  <p className="text-2xl font-black text-indigo-400">{dbViewsCount}</p>
                  <p className="text-[10px] text-slate-400">Impression views in DB</p>
                </div>
              </div>
            </div>

            {/* SEO Sitemap Generator Card */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">SEO Sitemap Generator</h3>
                    <p className="text-xs text-slate-400">
                      Generate an XML sitemap with all static pages, stores, categories, and deal URLs for search engine indexing.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleGenerateSitemap}
                  disabled={isGeneratingSitemap}
                  className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-sm transition-all flex items-center gap-2 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingSitemap ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingSitemap ? 'Generating Sitemap...' : 'Generate Sitemap.xml'}</span>
                </button>
              </div>

              {sitemapResult && (
                <div className="space-y-3">
                  <div className="p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-semibold flex flex-wrap items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sitemapResult.message}</span>
                    {sitemapResult.urlCount > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg">
                        {sitemapResult.urlCount} URLs
                      </span>
                    )}
                  </div>

                  {sitemapResult.sitemapUrl && (
                    <div className="flex items-center gap-2">
                      <a
                        href={sitemapResult.sitemapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>View /sitemap.xml</span>
                      </a>
                      <button
                        onClick={() => {
                          const blob = new Blob([sitemapResult.xml], { type: 'application/xml' });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement('a');
                          link.href = url;
                          link.download = 'sitemap.xml';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download XML</span>
                      </button>
                      <button
                        onClick={() => setShowSitemapXml(!showSitemapXml)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-2 transition-all border border-slate-700"
                      >
                        <span>{showSitemapXml ? 'Hide XML' : 'View XML'}</span>
                      </button>
                    </div>
                  )}

                  {showSitemapXml && sitemapResult.xml && (
                    <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-[10px] text-emerald-300 font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                      {sitemapResult.xml}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Amazon Affiliate Quick Import Prompt Banner */}
            <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 rounded-3xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-slate-950/20 rounded-full text-[11px] font-black uppercase tracking-wider text-slate-950">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>NEW FEATURE</span>
                </div>
                <h3 className="text-xl font-black tracking-tight text-slate-950">
                  Amazon Product Link Importer & Category Categorizer
                </h3>
                <p className="text-xs font-medium text-slate-900/90 max-w-2xl">
                  Paste any Amazon India product URL or ASIN (e.g. B0CX58S7S9). Automatically extracts title, MRP, deal price, image, assigns product category, attaches your Amazon Tag (<strong className="font-bold underline">tag={affiliateConfigs.Amazon.tag || 'mondaybazaar-21'}</strong>), and lists it in the store catalog.
                </p>
              </div>

              <button
                onClick={() => navigate('/admin/amazon-import')}
                className="px-6 py-3 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs rounded-2xl shadow-md transition-all shrink-0 flex items-center gap-2 group"
              >
                <span>Launch Amazon Importer</span>
                <ArrowLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Quick Affiliate Link Generator Bar */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-base">Instant Affiliate Link Generator & Converter</h3>
                </div>
                <span className="text-xs text-slate-400 font-mono">1-Click Auto Parameter Tagging</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-3">
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Target Store</label>
                  <select
                    value={testStoreSelect}
                    onChange={(e) => setTestStoreSelect(e.target.value as StoreName)}
                    className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {Object.keys(STORES_INFO).map(store => (
                      <option key={store} value={store}>{store}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-7">
                  <label className="block text-[11px] uppercase font-bold text-slate-400 mb-1">Raw Product Link / URL</label>
                  <input
                    type="text"
                    value={testUrlInput}
                    onChange={(e) => setTestUrlInput(e.target.value)}
                    placeholder="Paste raw Amazon, Flipkart, Myntra, or Ajio URL..."
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleTestConvert}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Convert URL</span>
                  </button>
                </div>
              </div>

              {generatedAffiliateUrl && (
                <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 space-y-2 animate-in fade-in">
                  <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Converted Monitized Affiliate URL:</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedAffiliateUrl}
                      className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-slate-300"
                    />
                    <button
                      onClick={handleCopyGenerated}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors shrink-0"
                    >
                      {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <a
                      href={generatedAffiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors shrink-0"
                      title="Test Open Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Store Wise Distribution Table */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Affiliate Stores Performance & Commission Matrix</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Store</th>
                      <th className="py-3 px-4 font-bold">Affiliate Tag Parameter</th>
                      <th className="py-3 px-4 font-bold">Tag Value</th>
                      <th className="py-3 px-4 font-bold">Commission Rate</th>
                      <th className="py-3 px-4 font-bold">Active Deals</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(Object.keys(STORES_INFO) as StoreName[]).map(store => {
                      const cfg = affiliateConfigs[store] || DEFAULT_AFFILIATE_CONFIGS[store];
                      const storeDealsCount = deals.filter(d => d.store === store && d.isActive !== false).length;

                      return (
                        <tr key={store} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STORES_INFO[store]?.accentColor || '#f97316' }} />
                            <span>{store}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-600">{cfg?.tagParam}</td>
                          <td className="py-3 px-4 font-mono text-indigo-600 font-bold">{cfg?.tagValue}</td>
                          <td className="py-3 px-4 font-bold text-emerald-600">{cfg?.commissionRate}%</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{storeDealsCount} deals</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              cfg?.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {cfg?.isActive ? 'Active' : 'Disabled'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ==================== TAB 2: AMAZON AFFILIATE IMPORTER ==================== */}
        {currentTab === 'amazon-import' && (
          <AmazonAffiliateImporter
            amazonTag={affiliateConfigs.Amazon.tag || 'mondaybazaar-21'}
            onPublishDeal={onAddDeal}
          />
        )}

        {/* ==================== TAB: CSV IMPORT ==================== */}
        {currentTab === 'csv-import' && (
          <div className="max-w-full space-y-6 animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  Bulk Deal Import via CSV
                </h3>
                <p className="text-xs text-slate-500 mt-1">Upload a CSV file to bulk import deals into the catalog. Download the template first to ensure correct formatting.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={downloadCsvTemplate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
                
                <label className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Choose CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCsvFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              {csvFile && (
                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  <span className="font-medium">{csvFile.name}</span>
                  <span className="text-slate-400">({(csvFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}

              {csvError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                  {csvError}
                </div>
              )}

              {csvProgress && !csvError && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700">
                  {csvProgress}
                </div>
              )}

              {csvPreview && csvPreview.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900">
                      Preview ({csvPreview.length} deals)
                    </h4>
                    <button
                      onClick={handleCsvImport}
                      disabled={csvImporting}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-2"
                    >
                      {csvImporting ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                          Importing...
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          Import All Deals
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-bold text-slate-700">Title</th>
                          <th className="text-left p-2 font-bold text-slate-700">Store</th>
                          <th className="text-left p-2 font-bold text-slate-700">Category</th>
                          <th className="text-right p-2 font-bold text-slate-700">Price</th>
                          <th className="text-right p-2 font-bold text-slate-700">Discount</th>
                          <th className="text-left p-2 font-bold text-slate-700">Posted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {csvPreview.map((deal, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2 font-medium text-slate-900 max-w-xs truncate">{deal.title}</td>
                            <td className="p-2 text-slate-600">{deal.store}</td>
                            <td className="p-2 text-slate-600">{deal.category}</td>
                            <td className="p-2 text-right font-bold text-slate-900">₹{deal.dealPrice.toLocaleString('en-IN')}</td>
                            <td className="p-2 text-right font-bold text-emerald-600">{deal.discountPercentage}%</td>
                            <td className="p-2 text-slate-500">{deal.postedAt}</td>
                          </tr>
                        ))}
                      </tbody>
                </table>
              </div>
            </div>
              )}

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 space-y-1">
                <p className="font-bold">CSV Format Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-700">
                  <li>Download the template above and fill in your deal data.</li>
                  <li>Store names must match exactly: Amazon, Flipkart, Myntra, Ajio, Tata CLiQ, Croma, Reliance Digital, Boat, Noise, Samsung, Apple.</li>
                  <li>Categories must match exactly: Mobiles &amp; Tablets, Electronics &amp; Laptops, Audio &amp; Headphones, Fashion &amp; Apparel, Home &amp; Kitchen, Gaming &amp; Accessories, Beauty &amp; Grooming, Smartwatches.</li>
                  <li>For multi-value fields like aiPros and aiCons, use pipe <code className="bg-amber-100 px-1 rounded">|</code> to separate items.</li>
                  <li>For priceHistory, use format: <code className="bg-amber-100 px-1 rounded">date:price|date:price</code> (e.g. <code className="bg-amber-100 px-1 rounded">Aug 20:59999|Aug 23:47999</code>).</li>
                  <li>Boolean fields use <code className="bg-amber-100 px-1 rounded">true</code> or <code className="bg-amber-100 px-1 rounded">false</code>.</li>
                  <li>Leave optional fields empty if not applicable; defaults will be applied.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* ==================== TAB: FACEBOOK & INSTAGRAM AUTO-POSTER ==================== */}
        {currentTab === 'social-autopost' && (
          <SocialAutoPoster
            deals={deals}
            addToast={addToast}
          />
        )}

        {/* ==================== TAB 3: DEALS CATALOG MANAGEMENT ==================== */}
        {currentTab === 'deals' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Search & Action Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1 w-full relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by deal title, store, or category..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Status ({deals.length})</option>
                  <option value="Active">🟢 Active ({activeDeals.length})</option>
                  <option value="Inactive">⚪ Inactive ({inactiveDeals.length})</option>
                </select>

                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Stores</option>
                  {Object.keys(STORES_INFO).map(s => <option key={s} value={s}>{s}</option>)}
                </select>

                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                >
                  <option value="All">All Categories</option>
                  <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                  <option value="Electronics & Laptops">Electronics & Laptops</option>
                  <option value="Audio & Headphones">Audio & Headphones</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Home & Kitchen">Home & Kitchen</option>
                  <option value="Smartwatches">Smartwatches</option>
                </select>

                <select
                  value={minDiscount}
                  onChange={(e) => setMinDiscount(Number(e.target.value))}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
                  title="Filter by minimum discount percentage"
                >
                  <option value={0}>All Discounts</option>
                  <option value={10}>10%+ off</option>
                  <option value={20}>20%+ off</option>
                  <option value={30}>30%+ off</option>
                  <option value={40}>40%+ off (Loot)</option>
                  <option value={50}>50%+ off</option>
                  <option value={60}>60%+ off</option>
                  <option value={70}>70%+ off</option>
                </select>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setLootOnly(!lootOnly)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      lootOnly
                        ? 'bg-red-50 text-red-700 border-red-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Only Loot Deals"
                  >
                    <Flame className="w-3 h-3 text-red-600 fill-red-600" />
                    <span>Loot</span>
                  </button>
                  <button
                    onClick={() => setVerifiedOnly(!verifiedOnly)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      verifiedOnly
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Only Verified Deals"
                  >
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span>Verified</span>
                  </button>
                  <button
                    onClick={() => setCouponOnly(!couponOnly)}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center gap-1 transition-all cursor-pointer ${
                      couponOnly
                        ? 'bg-amber-50 text-amber-700 border-amber-300 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Only Deals with Coupon Codes"
                  >
                    <Tag className="w-3 h-3 text-amber-600" />
                    <span>Coupon</span>
                  </button>
                </div>

                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Deal</span>
                </button>
              </div>
            </div>

            {/* Active / Inactive Summary Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-emerald-800">Active Deals</span>
                </div>
                <span className="text-2xl font-black text-emerald-700">{activeDeals.length}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span className="text-xs font-bold text-slate-700">Inactive Deals</span>
                </div>
                <span className="text-2xl font-black text-slate-600">{inactiveDeals.length}</span>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-orange-800">Total Catalog</span>
                </div>
                <span className="text-2xl font-black text-orange-700">{totalCatalogDealsCount}</span>
              </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Catalog List ({filteredAdminDeals.length} Deals)
                  {statusFilter !== 'All' && (
                    <span className="ml-2 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-full">
                      Filter: {statusFilter === 'Active' ? '🟢 Active' : '⚪ Inactive'}
                    </span>
                  )}
                  {minDiscount > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-full">
                      🔥 {minDiscount}%+ off
                    </span>
                  )}
                </h3>
                <span className="text-xs text-slate-500">Live preview update instant</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Product / Title</th>
                      <th className="py-3 px-4 font-bold">Status</th>
                      <th className="py-3 px-4 font-bold">Store</th>
                      <th className="py-3 px-4 font-bold">Price & Discount</th>
                      <th className="py-3 px-4 font-bold">Coupon</th>
                      <th className="py-3 px-4 font-bold">Badges</th>
                      <th className="py-3 px-4 font-bold">AI Score</th>
                      <th className="py-3 px-4 font-bold text-right uppercase tracking-wider text-slate-600">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedDeals.map((deal) => {
                      const affUrl = buildAffiliateUrl(deal.dealUrl, deal.store, affiliateConfigs);
                      const isActive = deal.isActive !== false;

                      return (
                        <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={deal.imageUrl}
                                alt={deal.title}
                                className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
                              />
                              <div className="min-w-0">
                                <p className={`font-bold line-clamp-1 ${isActive ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                                  {deal.title}
                                </p>
                                <p className="text-[10px] text-slate-500">{deal.category} • Posted by {deal.postedBy}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <button
                              onClick={() => {
                                const updated = { ...deal, isActive: !isActive };
                                onUpdateDeal(updated);
                              }}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer ${
                                isActive
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                  : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                              }`}
                              title="Click to toggle Active / Inactive"
                            >
                              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              <span>{isActive ? 'Active' : 'Inactive'}</span>
                            </button>
                          </td>

                          <td className="py-3 px-4 font-bold text-slate-800">
                            <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700">
                              {deal.store}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-black text-slate-900">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                              <span className="text-[10px] text-slate-400 line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                              <span className="font-bold text-red-600 text-[10px]">-{deal.discountPercentage}%</span>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono font-bold text-amber-700">
                            {deal.couponCode ? (
                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-md">
                                {deal.couponCode}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-normal">-</span>
                            )}
                          </td>

                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5">
                              {deal.isLootDeal && (
                                <span className="px-2 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md flex items-center gap-0.5">
                                  <Flame className="w-3 h-3 text-red-600 fill-red-600" /> LOOT
                                </span>
                              )}
                              {deal.isVerified && (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">
                                  Verified
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 font-black text-xs rounded-md">
                              {deal.aiScore}/100
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <a
                                href={affUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                                title="Open Deal Link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => handleOpenEditModal(deal)}
                                className="px-3 py-1.5 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/90 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                title="Edit Deal"
                              >
                                <Edit className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Edit</span>
                              </button>

                              <button
                                onClick={() => setDealToDelete(deal)}
                                className="px-3 py-1.5 bg-red-50/80 hover:bg-red-100 text-red-600 border border-red-200/90 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                                title="Delete Deal"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredAdminDeals.length > pageSize && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                  <div className="text-[11px] text-slate-500 font-medium">
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAdminDeals.length)} to {Math.min(currentPage * pageSize, filteredAdminDeals.length)} of {filteredAdminDeals.length} deals
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <span className="px-2 py-1 text-[11px] font-bold text-slate-600">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* ==================== TAB 3: AFFILIATION RULES & STORE CONFIG ==================== */}
        {currentTab === 'affiliation' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">E-Commerce Store Affiliate Tag Rules</h3>
                  <p className="text-xs text-slate-500">Configure partner IDs, affiliate subIDs, and commission percentages per store. Changes auto-apply to all deal links across the website.</p>
                </div>
                <button
                  onClick={() => {
                    setAffiliateConfigs(DEFAULT_AFFILIATE_CONFIGS);
                    alert('Reset affiliate configs to defaults!');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore Defaults</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(Object.keys(STORES_INFO) as StoreName[]).map(store => {
                const config = affiliateConfigs[store] || DEFAULT_AFFILIATE_CONFIGS[store];

                return (
                  <div key={store} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: STORES_INFO[store]?.accentColor || '#f97316' }} />
                        <h4 className="font-black text-sm text-slate-900">{store}</h4>
                        {storeStatuses[store] === 'closed' && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 font-extrabold text-[10px] rounded-md">CLOSED</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Shop Status</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={storeStatuses[store] === 'open'}
                            onChange={(e) => handleUpdateStoreStatus(store, e.target.checked ? 'open' : 'closed')}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Affiliate Parameter Key</label>
                        <input
                          type="text"
                          value={config.tagParam}
                          onChange={(e) => handleUpdateAffiliateRule(store, 'tagParam', e.target.value)}
                          placeholder="e.g. tag or affid"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Your Partner Tag / SubID</label>
                        <input
                          type="text"
                          value={config.tagValue}
                          onChange={(e) => handleUpdateAffiliateRule(store, 'tagValue', e.target.value)}
                          placeholder="e.g. mondaybazaar-21"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-indigo-700 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Estimated Commission Rate (%)</label>
                        <div className="relative flex items-center">
                          <input
                            type="number"
                            step="0.5"
                            value={config.commissionRate}
                            onChange={(e) => handleUpdateAffiliateRule(store, 'commissionRate', Number(e.target.value))}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 pr-8"
                          />
                          <span className="absolute right-3 text-xs font-bold text-slate-400">%</span>
                        </div>
                      </div>

                      <p className="text-[10px] text-slate-400 italic pt-1">{config.notes}</p>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* ==================== TAB 4: SITE BANNERS & SETTINGS ==================== */}
        {currentTab === 'settings' && (
          <div className="max-w-full space-y-6 animate-in fade-in duration-200">
            
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-base text-slate-900">Top Announcement Banner Configuration</h3>
                <p className="text-xs text-slate-500">Enable and customize the top ticker announcement shown across Monday Bazaar storefront.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div>
                    <p className="font-bold text-slate-900">Display Top Ticker Banner</p>
                    <p className="text-[11px] text-slate-500">Shows banner above navigation header</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={siteBanner.enabled}
                      onChange={(e) => setSiteBanner(prev => ({ ...prev, enabled: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Banner Tag / Badge</label>
                  <input
                    type="text"
                    value={siteBanner.badge}
                    onChange={(e) => setSiteBanner(prev => ({ ...prev, badge: e.target.value }))}
                    placeholder="e.g. FLASH LOOT SALE"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-orange-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Banner Ticker Message</label>
                  <textarea
                    rows={2}
                    value={siteBanner.text}
                    onChange={(e) => setSiteBanner(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="e.g. 🔥 Monday Bazaar Super Sale is LIVE!"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                {/* Banner Preview */}
                <div className="pt-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Live Storefront Banner Preview:</p>
                  <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white py-2 px-4 text-xs font-bold flex items-center justify-center gap-2 rounded-xl shadow-xs">
                    <span className="bg-black/20 px-2 py-0.5 rounded text-[10px] uppercase">{siteBanner.badge}</span>
                    <span>{siteBanner.text}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Password & Database Authentication Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Admin Account & Database Password Security</h3>
                    <p className="text-xs text-slate-500">Update your authenticated admin portal password</p>
                  </div>
                </div>
                {adminUser && (
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" />
                    <span>{adminUser.email}</span>
                  </span>
                )}
              </div>

              {passChangeMsg && (
                <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center justify-between ${
                  passChangeMsg.type === 'success' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                  <div className="flex items-center gap-2">
                    {passChangeMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                    <span>{passChangeMsg.text}</span>
                  </div>
                  <button onClick={() => setPassChangeMsg(null)} className="font-bold text-xs text-slate-500 hover:text-slate-800">✕</button>
                </div>
              )}

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Admin Password</label>
                  <input
                    type="password"
                    required
                    value={currPass}
                    onChange={(e) => setCurrPass(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Admin Password</label>
                  <input
                    type="password"
                    required
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new strong password"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Default Passwords: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-mono">admin123</code>
                  </span>
                  <button
                    type="submit"
                    disabled={isUpdatingPass}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{isUpdatingPass ? 'Updating Password...' : 'Update Admin Password'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Supabase Database Engine & Cloud PostgreSQL Integration Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Supabase Cloud PostgreSQL Database</h3>
                    <p className="text-xs text-slate-500">Live Supabase integration for deals, users, analytics, & affiliate configuration</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleMigrateToSupabase}
                    disabled={isMigrating}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isMigrating ? 'Syncing...' : '⚡ Sync Data to Supabase'}</span>
                  </button>
                  <button
                    onClick={() => setShowSqlModal(true)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span>📋 SQL Schema</span>
                  </button>
                  <button
                    onClick={handleMigrateToSupabase}
                    disabled={isMigrating}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <span>Sync Supabase</span>
                  </button>
                  <button
                    onClick={fetchDbData}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {migrationResult && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center justify-between">
                  <span>{migrationResult}</span>
                  <button onClick={() => setMigrationResult(null)} className="text-emerald-500 hover:text-emerald-800 font-bold ml-2">✕</button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supabase Project Endpoint</span>
                  <p className="font-mono font-bold text-emerald-700 truncate">{dbInfo?.url || 'https://pmvnyxpyypifneqojlqq.supabase.co'}</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supabase Database Connection</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-black text-emerald-700">🟢 Connected & Active</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Supabase Schema / Tables</span>
                  <p className="font-mono text-slate-700 font-bold">
                    deals, users, link_clicks, deal_views, affiliate_configs, site_config
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Client API Key Type</span>
                  <p className="font-mono text-slate-700 font-bold">sb_publishable_Key (REST & Realtime Active)</p>
                </div>
              </div>

              <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono space-y-2 border border-slate-800">
                <p className="text-emerald-400 font-bold"># Supabase Database Configuration (.env)</p>
                <p className="text-emerald-300 font-bold">SUPABASE_URL={dbInfo?.url || 'https://pmvnyxpyypifneqojlqq.supabase.co'}</p>
                <p className="text-emerald-300 font-bold">SUPABASE_KEY=sb_publishable_QdwxI3KvRW... (Configured)</p>
              </div>
            </div>

            {/* Backup / Export Data */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="font-extrabold text-base text-slate-900">Catalog & System Data Backup</h3>
              <p className="text-xs text-slate-500">Download or restore catalog data in JSON format for record keeping.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(deals, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `monday_bazaar_deals_backup_${Date.now()}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                  }}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Export All Deals (JSON)</span>
                </button>
              </div>
            </div>

          </div>
        )}

        </div>
      </div>

      {/* ==================== ADD / EDIT DEAL MODAL ==================== */}
      {isDealModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
                  <Tag className="w-5 h-5" />
                </div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingDeal ? 'Edit Bargain Deal' : 'Post New Deal as Admin'}
                </h3>
              </div>
              <button
                onClick={() => setIsDealModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSaveDeal} className="space-y-4 text-xs">
              
              {dealModalError && (
                <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-red-700 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <span>{dealModalError}</span>
                </div>
              )}
              
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Apple iPhone 15 (128GB) - Black"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Store / E-Commerce *</label>
                  <select
                    value={formData.store}
                    onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value as StoreName }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {Object.keys(STORES_INFO).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CategoryName }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    <option value="Mobiles & Tablets">Mobiles & Tablets</option>
                    <option value="Electronics & Laptops">Electronics & Laptops</option>
                    <option value="Audio & Headphones">Audio & Headphones</option>
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Home & Kitchen">Home & Kitchen</option>
                    <option value="Smartwatches">Smartwatches</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Original Price (MRP) ₹</label>
                  <input
                    type="number"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, originalPrice: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Deal Price ₹ *</label>
                  <input
                    type="number"
                    required
                    value={formData.dealPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, dealPrice: Number(e.target.value) }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Coupon Code (Optional)</label>
                  <input
                    type="text"
                    value={formData.couponCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value }))}
                    placeholder="e.g. SAVE1000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-amber-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700">Product Deal URL *</label>
                  <button
                    type="button"
                    onClick={handleAutoFetchLink}
                    disabled={isAnalyzingLink}
                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-extrabold text-[11px] rounded-lg shadow-xs flex items-center gap-1 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAnalyzingLink ? 'Extracting Title...' : 'Auto-Fetch Title & Details'}</span>
                  </button>
                </div>
                <input
                  type="url"
                  required
                  value={formData.dealUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealUrl: e.target.value }))}
                  placeholder="Paste Amazon link e.g. https://link.amazon/B0fBQlm3o..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Image URL *</label>
                <div className="flex items-center gap-3">
                  {formData.imageUrl ? (
                    <img
                      src={formData.imageUrl}
                      alt="Product preview"
                      className="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-slate-100"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0 font-bold">
                      No Img
                    </div>
                  )}
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deal Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              {/* Toggles & Status */}
              <div className="space-y-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Product Status (Active / Inactive)</label>
                  <select
                    value={formData.isActive !== false ? 'active' : 'inactive'}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-xs"
                  >
                    <option value="active">🟢 Active (Visible to store users)</option>
                    <option value="inactive">⚪ Inactive (Hidden from store users)</option>
                  </select>
                </div>

                <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isLootDeal}
                      onChange={(e) => setFormData(prev => ({ ...prev, isLootDeal: e.target.checked }))}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <span className="flex items-center gap-1 text-red-600">
                      <Flame className="w-4 h-4 fill-red-600" />
                      Mark as LOOT DEAL
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 text-xs">
                    <input
                      type="checkbox"
                      checked={formData.isVerified}
                      onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-emerald-700">Verified Badge</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDealModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {editingDeal ? 'Save Deal Changes' : 'Publish New Deal'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Supabase SQL Schema Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">Supabase SQL Table Schema Setup</h3>
                  <p className="text-xs text-slate-500">Run this script in Supabase Dashboard {'->'} SQL Editor to create tables</p>
                </div>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-slate-700 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              If your Supabase project is new, open your <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-bold">Supabase Dashboard</a>, navigate to <strong>SQL Editor</strong>, paste the script below, and click <strong>Run</strong>. Then return here and click <strong>⚡ Sync Data to Supabase</strong>.
            </p>

            <div className="relative flex-1 bg-slate-900 text-slate-100 rounded-2xl p-4 overflow-auto font-mono text-[11px] leading-relaxed border border-slate-800">
              <pre>{supabaseSqlSchema}</pre>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(supabaseSqlSchema);
                  setCopiedSql(true);
                  setTimeout(() => setCopiedSql(false), 2500);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{copiedSql ? '✓ Copied to Clipboard!' : '📋 Copy SQL Script'}</span>
              </button>
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />

      {/* Delete Confirmation Toast Dialog */}
      <ConfirmDeleteModal
        isOpen={!!dealToDelete}
        deal={dealToDelete}
        onClose={() => setDealToDelete(null)}
        onConfirm={handleConfirmDeleteDeal}
      />

    </div>
  );
};
