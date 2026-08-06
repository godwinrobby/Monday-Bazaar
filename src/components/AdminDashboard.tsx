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
  ShoppingBag
} from 'lucide-react';
import { AmazonAffiliateImporter } from './AmazonAffiliateImporter';

interface AdminDashboardProps {
  deals: Deal[];
  onAddDeal: (newDeal: Deal) => void;
  onUpdateDeal: (updatedDeal: Deal) => void;
  onDeleteDeal: (dealId: string) => void;
  onCloseAdmin: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  deals,
  onAddDeal,
  onUpdateDeal,
  onDeleteDeal,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'amazon-import' | 'deals' | 'affiliation' | 'pending' | 'settings'>('overview');

  // Affiliate Config State with LocalStorage Persistence
  const [affiliateConfigs, setAffiliateConfigs] = useState<Record<StoreName, StoreAffiliateConfig>>(() => {
    try {
      const saved = localStorage.getItem('monday_bazaar_affiliate_configs');
      return saved ? JSON.parse(saved) : DEFAULT_AFFILIATE_CONFIGS;
    } catch {
      return DEFAULT_AFFILIATE_CONFIGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('monday_bazaar_affiliate_configs', JSON.stringify(affiliateConfigs));
  }, [affiliateConfigs]);

  // Site Banner Settings
  const [siteBanner, setSiteBanner] = useState(() => {
    try {
      const saved = localStorage.getItem('monday_bazaar_site_banner');
      return saved ? JSON.parse(saved) : {
        enabled: true,
        text: '🔥 Monday Bazaar Super Sale is LIVE! Grab exclusive coupons & loot deals across Amazon, Flipkart & Myntra.',
        badge: 'FLASH LOOT SALE'
      };
    } catch {
      return {
        enabled: true,
        text: '🔥 Monday Bazaar Super Sale is LIVE! Grab exclusive coupons & loot deals across Amazon, Flipkart & Myntra.',
        badge: 'FLASH LOOT SALE'
      };
    }
  });

  useEffect(() => {
    localStorage.setItem('monday_bazaar_site_banner', JSON.stringify(siteBanner));
  }, [siteBanner]);

  // Deal Form Modal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Search & Filter State inside Admin
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

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
    aiScore: 90,
    aiVerdict: 'Verified high-discount offer with solid price drop history.',
    aiPros: ['Great savings compared to standard MRP', 'Verified merchant deal'],
    aiCons: ['Limited stock offer'],
    postedBy: 'Admin_Master',
  });

  // Open Add Deal Modal
  const handleOpenAddModal = () => {
    setEditingDeal(null);
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
    setFormData({ ...deal });
    setIsDealModalOpen(true);
  };

  // Save Deal Form
  const handleSaveDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.dealUrl || !formData.dealPrice) {
      alert('Please fill in title, deal price, and valid deal URL');
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
        aiScore: Number(formData.aiScore) || 85,
        aiVerdict: formData.aiVerdict || 'Verified deal',
      };
      onUpdateDeal(updated);
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
        upvotes: 25,
        downvotes: 0,
        aiScore: Number(formData.aiScore) || 90,
        aiVerdict: formData.aiVerdict || 'Verified offer added by admin.',
        aiPros: formData.aiPros || ['Verified merchant link', 'Immediate savings'],
        aiCons: formData.aiCons || ['Check stock availability'],
        postedAt: 'Just now',
        priceHistory: [
          { date: 'Previous', price: origPrice },
          { date: 'Today', price: dealPriceNum },
        ],
        commentsCount: 0,
        comments: [],
        viewsCount: 150,
        postedBy: 'Admin_Master',
      };
      onAddDeal(newDeal);
    }

    setIsDealModalOpen(false);
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

  // Filtered deals in admin table
  const filteredAdminDeals = deals.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.store.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          d.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStore = storeFilter === 'All' || d.store === storeFilter;
    const matchesCategory = categoryFilter === 'All' || d.category === categoryFilter;
    return matchesSearch && matchesStore && matchesCategory;
  });

  // Calculate Metrics
  const totalDealsCount = deals.length;
  const totalLootDealsCount = deals.filter(d => d.isLootDeal).length;
  const totalVerifiedCount = deals.filter(d => d.isVerified).length;
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
    <div id="admin-management-console" className="min-h-screen bg-slate-100 text-slate-800 pb-16">
      
      {/* Top Admin Navigation Header */}
      <div className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-600 rounded-xl text-white shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight text-white">
                  Monday Bazaar <span className="text-orange-500 font-bold">Admin Console</span>
                </h1>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-[10px] uppercase rounded-md border border-emerald-500/30">
                  LIVE CONTROLS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Deals, Affiliation Tracking & Catalog Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleOpenAddModal}
              id="admin-add-deal-btn"
              className="px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Deal</span>
            </button>

            <button
              onClick={onCloseAdmin}
              id="back-to-storefront-btn"
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4 text-orange-400" />
              <span>Exit Admin / View Website</span>
            </button>
          </div>

        </div>

        {/* Admin Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'overview'
                ? 'border-orange-500 text-orange-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('amazon-import')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'amazon-import'
                ? 'border-amber-500 text-amber-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <span>Amazon Affiliate Fetcher</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-extrabold rounded text-[10px]">Auto Import</span>
          </button>

          <button
            onClick={() => setActiveTab('deals')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'deals'
                ? 'border-orange-500 text-orange-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Deals Catalog ({deals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('affiliation')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'affiliation'
                ? 'border-orange-500 text-orange-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Link2 className="w-4 h-4 text-emerald-400" />
            <span>Affiliation & Store Rules</span>
            <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">Active</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 font-bold text-xs flex items-center gap-2 border-b-2 transition-all shrink-0 ${
              activeTab === 'settings'
                ? 'border-orange-500 text-orange-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Site Banners & Configuration</span>
          </button>
        </div>
      </div>

      {/* Main Admin Tab Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* ==================== TAB 1: OVERVIEW & ANALYTICS ==================== */}
        {activeTab === 'overview' && (
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
                onClick={() => setActiveTab('amazon-import')}
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
                      const storeDealsCount = deals.filter(d => d.store === store).length;

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
        {activeTab === 'amazon-import' && (
          <AmazonAffiliateImporter
            amazonTag={affiliateConfigs.Amazon.tag || 'mondaybazaar-21'}
            onPublishDeal={onAddDeal}
          />
        )}

        {/* ==================== TAB 3: DEALS CATALOG MANAGEMENT ==================== */}
        {activeTab === 'deals' && (
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

                <button
                  onClick={handleOpenAddModal}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Deal</span>
                </button>
              </div>
            </div>

            {/* Deals Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Catalog List ({filteredAdminDeals.length} Deals)
                </h3>
                <span className="text-xs text-slate-500">Live preview update instant</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4 font-bold">Product / Title</th>
                      <th className="py-3 px-4 font-bold">Store</th>
                      <th className="py-3 px-4 font-bold">Price & Discount</th>
                      <th className="py-3 px-4 font-bold">Coupon</th>
                      <th className="py-3 px-4 font-bold">Badges</th>
                      <th className="py-3 px-4 font-bold">AI Score</th>
                      <th className="py-3 px-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAdminDeals.map((deal) => {
                      const affUrl = buildAffiliateUrl(deal.dealUrl, deal.store, affiliateConfigs);

                      return (
                        <tr key={deal.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 max-w-xs">
                            <div className="flex items-center gap-3">
                              <img
                                src={deal.imageUrl}
                                alt={deal.title}
                                className="w-10 h-10 object-cover rounded-xl border border-slate-200 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900 line-clamp-1">{deal.title}</p>
                                <p className="text-[10px] text-slate-500">{deal.category} • Posted by {deal.postedBy}</p>
                              </div>
                            </div>
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
                            <div className="flex items-center justify-end gap-1.5">
                              <a
                                href={affUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 text-slate-600 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Test Affiliate Link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>

                              <button
                                onClick={() => handleOpenEditModal(deal)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit Deal"
                              >
                                <Edit className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  if (confirm(`Delete deal "${deal.title}"?`)) {
                                    onDeleteDeal(deal.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete Deal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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

        {/* ==================== TAB 3: AFFILIATION RULES & STORE CONFIG ==================== */}
        {activeTab === 'affiliation' && (
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
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={config.isActive}
                          onChange={(e) => handleUpdateAffiliateRule(store, 'isActive', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
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
        {activeTab === 'settings' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
            
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

      {/* Admin Dedicated Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-6 mt-16 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-slate-200">Monday Bazaar Admin Control Portal</span>
            <span className="text-slate-500">• Catalog & Affiliation Management</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={onCloseAdmin}
              className="text-orange-400 hover:text-orange-300 font-bold hover:underline transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Website Storefront</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-slate-500">System Status: <strong className="text-emerald-400 font-semibold">Online</strong></span>
          </div>
        </div>
      </footer>

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
                <label className="block font-bold text-slate-700 mb-1">Product Deal URL *</label>
                <input
                  type="url"
                  required
                  value={formData.dealUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, dealUrl: e.target.value }))}
                  placeholder="https://www.amazon.in/dp/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Product Image URL</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, imageUrl: e.target.value }))}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
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

              {/* Toggles */}
              <div className="flex items-center gap-6 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
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

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={formData.isVerified}
                    onChange={(e) => setFormData(prev => ({ ...prev, isVerified: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span className="text-emerald-700">Verified Badge</span>
                </label>
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

    </div>
  );
};
