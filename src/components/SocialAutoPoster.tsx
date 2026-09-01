import React, { useState, useEffect } from 'react';
import { Deal } from '../types';
import { supabaseDb } from '../db/supabaseDb';
import {
  Share2, 
  Send, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Sparkles, 
  Settings, 
  Eye, 
  Copy, 
  Check, 
  HelpCircle, 
  Trash2, 
  Flame, 
  ExternalLink,
  Layers,
  Radio,
  Sliders,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SocialAutoPosterProps {
  deals: Deal[];
  addToast: (toast: { type: 'success' | 'error' | 'info'; title: string; message: string }) => void;
}

interface SocialConfig {
  facebookEnabled: boolean;
  facebookPageId: string;
  facebookAccessToken: string;
  instagramEnabled: boolean;
  instagramAccountId: string;
  instagramAccessToken: string;
  autoPostOnNewDeal: boolean;
  autoPostLootOnly: boolean;
  postTemplate: string;
}

interface SocialLog {
  id: string;
  platform: 'facebook' | 'instagram';
  dealId: string;
  dealTitle: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SIMULATED';
  postUrl?: string;
  message: string;
  postedAt: string;
}

export const SocialAutoPoster: React.FC<SocialAutoPosterProps> = ({ deals, addToast }) => {
  const [config, setConfig] = useState<SocialConfig>({
    facebookEnabled: false,
    facebookPageId: '',
    facebookAccessToken: '',
    instagramEnabled: false,
    instagramAccountId: '',
    instagramAccessToken: '',
    autoPostOnNewDeal: true,
    autoPostLootOnly: false,
    postTemplate: `🔥 {title}\n💰 Deal Price: ₹{dealPrice} (MRP: ₹{originalPrice}) - {discountPercentage}% OFF!\n🏪 Store: {store}\n{couponCodeText}\n👉 Grab Deal Now: {dealUrl}\n\n#Dealsified #{store}Deals #LootDeal #OnlineShopping #Discounts`
  });

  const [logs, setLogs] = useState<SocialLog[]>([]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || '');
  const [showFbToken, setShowFbToken] = useState(false);
  const [showIgToken, setShowIgToken] = useState(false);

  // Individual post states
  const [isPostingFb, setIsPostingFb] = useState(false);
  const [isPostingIg, setIsPostingIg] = useState(false);
  const [isPostingBoth, setIsPostingBoth] = useState(false);

  // Selected deal for preview / broadcast
  const selectedDeal = deals.find(d => d.id === selectedDealId) || deals[0];

  // The Express backend (/api/*) is only available when server.ts is running
  // (local/dev). On the production static site it returns HTML, so the Admin UI
  // talks to Supabase directly (client-side) and falls back to /api when needed.

  // Fetch JSON or throw when the endpoint is not a real API (e.g. HTML SPA fallback)
  const fetchApiJson = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, init);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.includes('application/json')) {
      throw new Error('API_NOT_AVAILABLE');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return data;
  };

  // Load config & logs — Supabase first, Express API as fallback
  const loadData = async () => {
    setIsLoadingConfig(true);
    try {
      let loaded = false;
      try {
        const [config, logs] = await Promise.all([
          supabaseDb.getSocialConfig(),
          supabaseDb.getSocialLogs()
        ]);
        setConfig(prev => ({ ...prev, ...config }));
        setLogs(logs as any);
        loaded = true;
      } catch (e: any) {
        console.warn('Supabase social config load failed, falling back to API:', e?.message);
      }
      if (!loaded) {
        const [resConfig, resLogs] = await Promise.all([
          fetchApiJson('/api/social/config'),
          fetchApiJson('/api/social/logs')
        ]);
        if (resConfig.success && resConfig.config) setConfig(resConfig.config);
        if (resLogs.success && resLogs.logs) setLogs(resLogs.logs);
      }
    } catch (err) {
      console.error('Failed to load social poster settings:', err);
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (deals.length > 0 && !selectedDealId) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals]);

  // Save Social Settings — Supabase first, Express API as fallback
  const handleSaveConfig = async () => {
    setIsSavingConfig(true);
    try {
      let saved = false;
      let data: any;
      try {
        const updated = await supabaseDb.saveSocialConfig(config);
        data = { success: true, config: updated };
        saved = true;
      } catch (e: any) {
        console.warn('Supabase social config save failed, falling back to API:', e?.message);
      }
      if (!saved) {
        data = await fetchApiJson('/api/social/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });
      }
      if (data.success) {
        setConfig(data.config);
        addToast({
          type: 'success',
          title: 'Social Auto-Post Settings Saved',
          message: 'Facebook & Instagram feed broadcasting rules saved & persisted to Supabase!'
        });
      } else {
        throw new Error(data.error || 'Failed to save settings');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message === 'API_NOT_AVAILABLE'
          ? 'Backend API is not available and Supabase save failed. Check your connection.'
          : err.message
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Helper to format live preview caption
  const renderFormattedCaption = (deal?: Deal) => {
    if (!deal) return 'No deal selected';
    const couponText = deal.couponCode ? `🏷️ Coupon Code: ${deal.couponCode}` : '';
    return (config.postTemplate || '')
      .replace(/\{title\}/g, deal.title || '')
      .replace(/\{dealPrice\}/g, deal.dealPrice ? deal.dealPrice.toLocaleString('en-IN') : '')
      .replace(/\{originalPrice\}/g, deal.originalPrice ? deal.originalPrice.toLocaleString('en-IN') : '')
      .replace(/\{discountPercentage\}/g, String(deal.discountPercentage || 0))
      .replace(/\{store\}/g, deal.store || '')
      .replace(/\{couponCodeText\}/g, couponText)
      .replace(/\{couponCode\}/g, deal.couponCode || '')
      .replace(/\{dealUrl\}/g, deal.dealUrl || '')
      .replace(/\{imageUrl\}/g, deal.imageUrl || '');
  };

  // Insert Variable Token into Template
  const handleInsertPlaceholder = (token: string) => {
    setConfig(prev => ({
      ...prev,
      postTemplate: prev.postTemplate + ` ${token}`
    }));
  };

  // Manual Broadcast to Facebook
  const handleBroadcastFacebook = async () => {
    if (!selectedDeal) return;
    setIsPostingFb(true);
    try {
      let data: any;
      try {
        const res = await fetch('/api/social/post-facebook', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deal: selectedDeal
          })
        });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) throw new Error('API_NOT_AVAILABLE');
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to post to Facebook');
      } catch (apiErr: any) {
        // Express backend not available (static hosting) → publish via Supabase + Graph API
        data = await supabaseDb.publishSocialPost('facebook', selectedDeal, renderFormattedCaption(selectedDeal));
      }
      if (data.success) {
        addToast({
          type: data.simulated ? 'info' : 'success',
          title: data.simulated ? 'Facebook Post Simulated (Test Mode)' : 'Broadcasted to Facebook Page Feed!',
          message: data.message
        });
        loadData();
      } else {
        throw new Error(data.message || data.error || 'Failed to post to Facebook');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Facebook Broadcast Error',
        message: err.message
      });
    } finally {
      setIsPostingFb(false);
    }
  };

  // Manual Broadcast to Instagram
  const handleBroadcastInstagram = async () => {
    if (!selectedDeal) return;
    setIsPostingIg(true);
    try {
      let data: any;
      try {
        const res = await fetch('/api/social/post-instagram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deal: selectedDeal
          })
        });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (!ct.includes('application/json')) throw new Error('API_NOT_AVAILABLE');
        data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to post to Instagram');
      } catch (apiErr: any) {
        // Express backend not available (static hosting) → publish via Supabase + Graph API
        data = await supabaseDb.publishSocialPost('instagram', selectedDeal, renderFormattedCaption(selectedDeal));
      }
      if (data.success) {
        addToast({
          type: data.simulated ? 'info' : 'success',
          title: data.simulated ? 'Instagram Post Simulated (Test Mode)' : 'Broadcasted to Instagram Business Feed!',
          message: data.message
        });
        loadData();
      } else {
        throw new Error(data.message || data.error || 'Failed to post to Instagram');
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Instagram Broadcast Error',
        message: err.message
      });
    } finally {
      setIsPostingIg(false);
    }
  };

  // Broadcast to BOTH Facebook & Instagram
  const handleBroadcastBoth = async () => {
    if (!selectedDeal) return;
    setIsPostingBoth(true);
    try {
      await Promise.all([
        handleBroadcastFacebook(),
        handleBroadcastInstagram()
      ]);
    } finally {
      setIsPostingBoth(false);
    }
  };

  // Clear Social Logs — Supabase first, Express API as fallback
  const handleClearLogs = async () => {
    try {
      let cleared = false;
      try {
        cleared = await supabaseDb.clearSocialLogs();
      } catch (e: any) {
        console.warn('Supabase clear logs failed, falling back to API:', e?.message);
      }
      if (!cleared) {
        await fetchApiJson('/api/social/logs', { method: 'DELETE' });
      }
      setLogs([]);
      addToast({
        type: 'success',
        title: 'Logs Cleared',
        message: 'Social auto-posting history reset.'
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message
      });
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-orange-500 animate-spin mx-auto" />
        <p className="text-sm font-bold text-slate-600">Loading Facebook & Instagram Auto-Posting Settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-indigo-800/50 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 rounded-2xl text-white shadow-md">
              <Share2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Facebook & Instagram Feeds Auto-Broadcaster
                </h2>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  META GRAPH API READY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-indigo-200 mt-0.5">
                Automatically post new deals, loot discounts, and coupon drops directly to your official Facebook Page & Instagram Feed!
              </p>
            </div>
          </div>

          <button
            onClick={loadData}
            className="px-3.5 py-2 bg-indigo-800/60 hover:bg-indigo-700/80 text-indigo-100 text-xs font-bold rounded-xl border border-indigo-700/60 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Status</span>
          </button>
        </div>

        {/* Live Channel Status Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-indigo-800/60">
          
          {/* Facebook Page Status */}
          <div className="bg-indigo-950/70 p-3.5 rounded-2xl border border-indigo-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-lg shadow-sm">
                f
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  Facebook Page Feed
                  {config.facebookEnabled ? (
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded">AUTO ON</span>
                  ) : (
                    <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 font-extrabold text-[10px] rounded">PAUSED</span>
                  )}
                </p>
                <p className="text-[11px] text-indigo-300">
                  {config.facebookPageId ? `Page ID: ${config.facebookPageId}` : 'Credentials not configured'}
                </p>
              </div>
            </div>
            {config.facebookPageId && config.facebookAccessToken ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Info className="w-4 h-4" /> Test Mode
              </span>
            )}
          </div>

          {/* Instagram Feed Status */}
          <div className="bg-indigo-950/70 p-3.5 rounded-2xl border border-indigo-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center font-black text-white text-base shadow-sm">
                📸
              </div>
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  Instagram Business Feed
                  {config.instagramEnabled ? (
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] rounded">AUTO ON</span>
                  ) : (
                    <span className="px-1.5 py-0.2 bg-slate-700 text-slate-300 font-extrabold text-[10px] rounded">PAUSED</span>
                  )}
                </p>
                <p className="text-[11px] text-indigo-300">
                  {config.instagramAccountId ? `IG Account ID: ${config.instagramAccountId}` : 'Credentials not configured'}
                </p>
              </div>
            </div>
            {config.instagramAccountId && config.instagramAccessToken ? (
              <span className="flex items-center gap-1 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" /> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                <Info className="w-4 h-4" /> Test Mode
              </span>
            )}
          </div>

        </div>
      </div>

      {/* Main Settings & Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Config Forms & Rules (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Facebook & Instagram API Credentials Form */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">1. Meta Graph API Credentials</h3>
              </div>
              <button
                onClick={handleSaveConfig}
                disabled={isSavingConfig}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {isSavingConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>Save Social Settings</span>
              </button>
            </div>

            {/* Facebook Section */}
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                    f
                  </div>
                  <span className="text-sm font-black text-slate-900">Facebook Page Settings</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.facebookEnabled}
                    onChange={(e) => setConfig({ ...config, facebookEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">Auto Post</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Facebook Page ID
                  </label>
                  <input
                    type="text"
                    value={config.facebookPageId}
                    onChange={(e) => setConfig({ ...config, facebookPageId: e.target.value })}
                    placeholder="e.g. 109283748291038"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Page Access Token</label>
                    <button
                      type="button"
                      onClick={() => setShowFbToken(!showFbToken)}
                      className="text-[10px] font-bold text-blue-600 hover:underline"
                    >
                      {showFbToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showFbToken ? "text" : "password"}
                    value={config.facebookAccessToken}
                    onChange={(e) => setConfig({ ...config, facebookAccessToken: e.target.value })}
                    placeholder="EAAXXXXX..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Instagram Section */}
            <div className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center">
                    📸
                  </div>
                  <span className="text-sm font-black text-slate-900">Instagram Business Account</span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.instagramEnabled}
                    onChange={(e) => setConfig({ ...config, instagramEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  <span className="ml-2 text-xs font-bold text-slate-700">Auto Post</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Instagram Business Account ID
                  </label>
                  <input
                    type="text"
                    value={config.instagramAccountId}
                    onChange={(e) => setConfig({ ...config, instagramAccountId: e.target.value })}
                    placeholder="e.g. 178414002938481"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 bg-white font-mono"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700">Instagram / Meta User Token</label>
                    <button
                      type="button"
                      onClick={() => setShowIgToken(!showIgToken)}
                      className="text-[10px] font-bold text-pink-600 hover:underline"
                    >
                      {showIgToken ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showIgToken ? "text" : "password"}
                    value={config.instagramAccessToken}
                    onChange={(e) => setConfig({ ...config, instagramAccessToken: e.target.value })}
                    placeholder="EAAGXXXX..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-pink-500 bg-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Global Rules Options */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Broadcasting Rules & Filters</h4>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoPostOnNewDeal}
                    onChange={(e) => setConfig({ ...config, autoPostOnNewDeal: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Automatically trigger auto-post whenever a new deal is saved in Catalog
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.autoPostLootOnly}
                    onChange={(e) => setConfig({ ...config, autoPostLootOnly: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-500" />
                    Broadcasting Filter: Post LOOT DEALS only (Discount ≥ 40% or flagged as Loot)
                  </span>
                </label>
              </div>
            </div>

          </div>

          {/* Caption Template Editor */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">2. Feed Caption & Hashtags Template</h3>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Customize how product title, discounted prices, coupon codes, and affiliate shop links are rendered on Facebook & Instagram feeds.
            </p>

            {/* Variable Pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 py-0.5">Variables:</span>
              {[
                { token: '{title}', label: 'Product Title' },
                { token: '{dealPrice}', label: 'Deal Price (₹)' },
                { token: '{originalPrice}', label: 'MRP (₹)' },
                { token: '{discountPercentage}', label: 'Discount %' },
                { token: '{store}', label: 'Store Name' },
                { token: '{couponCodeText}', label: 'Coupon Line' },
                { token: '{dealUrl}', label: 'Affiliate URL' },
                 { token: '{imageUrl}', label: 'Product Image URL' },
              ].map(item => (
                <button
                  key={item.token}
                  type="button"
                  onClick={() => handleInsertPlaceholder(item.token)}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold rounded-lg border border-indigo-200 transition-colors"
                >
                  + {item.label}
                </button>
              ))}
            </div>

            <textarea
              rows={6}
              value={config.postTemplate}
              onChange={(e) => setConfig({ ...config, postTemplate: e.target.value })}
              className="w-full p-3.5 text-xs font-mono rounded-2xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 leading-relaxed bg-slate-50/50"
            />
          </div>

        </div>

        {/* Right Column: Live Feed Previews & Instant Manual Broadcast (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Instant Manual Broadcast Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Send className="w-5 h-5 text-orange-500" />
                <h3 className="text-base font-bold text-slate-900">3. Instant Manual Broadcast</h3>
              </div>
              <span className="text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">1-CLICK</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Select Deal from Catalog to Post:
              </label>
              <select
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-300 focus:ring-2 focus:ring-orange-500 bg-white"
              >
                {deals.map(d => (
                  <option key={d.id} value={d.id}>
                    [{d.store}] {d.title.slice(0, 45)}... (₹{d.dealPrice})
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                onClick={handleBroadcastFacebook}
                disabled={isPostingFb || isPostingBoth}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isPostingFb ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                <span>Post to Facebook Page Feed</span>
              </button>

              <button
                onClick={handleBroadcastInstagram}
                disabled={isPostingIg || isPostingBoth}
                className="w-full py-2.5 bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {isPostingIg ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>Post to Instagram Business Feed</span>
              </button>

              <button
                onClick={handleBroadcastBoth}
                disabled={isPostingBoth || isPostingFb || isPostingIg}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all border border-slate-700 disabled:opacity-50"
              >
                {isPostingBoth ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 text-orange-400" />}
                <span>Broadcast to BOTH Feeds Now</span>
              </button>
            </div>
          </div>

          {/* Facebook Post Card Preview */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                <div className="w-4 h-4 bg-blue-600 text-white rounded text-[10px] flex items-center justify-center font-black">f</div>
                Facebook Feed Card Preview
              </span>
              <span className="text-[11px] font-bold text-slate-400">Live Mockup</span>
            </div>

            {/* FB Card Visual */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="p-3.5 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    DB
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-slate-900">Dealsified Loot Deals</p>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 fill-blue-500/20" />
                    </div>
                    <p className="text-[10px] text-slate-400">Sponsored • Just now • 🌐</p>
                  </div>
                </div>
              </div>

              {/* Text Body */}
              <div className="p-3.5 text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                {renderFormattedCaption(selectedDeal)}
              </div>

              {/* Image Banner */}
              {selectedDeal?.imageUrl && (
                <div className="relative aspect-video bg-slate-100 overflow-hidden border-y border-slate-100">
                  <img
                    src={selectedDeal.imageUrl}
                    alt={selectedDeal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-orange-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-md uppercase">
                    {selectedDeal.discountPercentage}% OFF LOOT
                  </div>
                </div>
              )}

              {/* FB Card Footer */}
              <div className="p-2.5 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-bold border-t border-slate-100">
                <span>👍 Like</span>
                <span>💬 Comment</span>
                <span>↪ Share</span>
              </div>
            </div>
          </div>

          {/* Instagram Feed Card Preview */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                📸 Instagram Feed Card Preview
              </span>
              <span className="text-[11px] font-bold text-slate-400">Live Mockup</span>
            </div>

            {/* IG Card Visual */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <div className="p-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full p-[1.5px] bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-[10px] font-black text-slate-900">
                      DB
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-extrabold text-slate-900">dealsified_official</p>
                    <p className="text-[10px] text-slate-400">India E-Commerce Deals</p>
                  </div>
                </div>
              </div>

              {/* IG Square Image */}
              {selectedDeal?.imageUrl && (
                <div className="relative aspect-square bg-slate-900 overflow-hidden">
                  <img
                    src={selectedDeal.imageUrl}
                    alt={selectedDeal.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl border border-white/20 shadow-lg">
                    <p className="text-[10px] text-amber-400 font-bold uppercase">{selectedDeal.store}</p>
                    <p className="text-xs font-black text-white">₹{selectedDeal.dealPrice?.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              )}

              {/* IG Action Bar & Caption */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between text-base">
                  <div className="flex gap-3">
                    <span>❤️</span>
                    <span>💬</span>
                    <span>✈️</span>
                  </div>
                  <span>🔖</span>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  Liked by <span className="font-extrabold">deal_hunters</span> and <span className="font-extrabold">thousands of others</span>
                </p>
                <div className="text-xs text-slate-800 line-clamp-3 whitespace-pre-wrap font-sans">
                  <span className="font-extrabold text-slate-900 mr-1.5">dealsified_official</span>
                  {renderFormattedCaption(selectedDeal)}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Auto-Post Execution History Logs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-500" />
              Auto-Posting Execution History & Status Logs ({logs.length})
            </h3>
            <p className="text-xs text-slate-500">
              Live record of every auto-posted and manually triggered deal across Facebook Page & Instagram Feed.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Logs</span>
            </button>

            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Info className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-500">No auto-posting history recorded yet.</p>
            <p className="text-[11px] text-slate-400">Trigger an instant broadcast above or save a new deal in the catalog to test auto-posting!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-extrabold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Deal Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Message / Response</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.postedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.platform === 'facebook' ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-extrabold text-[11px] rounded-lg border border-blue-200 inline-flex items-center gap-1">
                          <div className="w-3 h-3 bg-blue-600 text-white rounded text-[8px] flex items-center justify-center font-black">f</div>
                          Facebook Feed
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-pink-50 text-pink-700 font-extrabold text-[11px] rounded-lg border border-pink-200 inline-flex items-center gap-1">
                          📸 Instagram Feed
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {log.dealTitle}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {log.status === 'SUCCESS' && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase rounded-md flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUCCESS
                        </span>
                      )}
                      {log.status === 'SIMULATED' && (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 font-bold text-[10px] uppercase rounded-md flex items-center gap-1 w-max">
                          <Info className="w-3 h-3 text-amber-600" /> TEST MODE
                        </span>
                      )}
                      {log.status === 'FAILED' && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-bold text-[10px] uppercase rounded-md flex items-center gap-1 w-max">
                          <XCircle className="w-3 h-3 text-rose-600" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate text-[11px]">
                      {log.message}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {log.postUrl ? (
                        <a
                          href={log.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          View Post <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
