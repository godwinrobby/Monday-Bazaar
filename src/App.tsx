import React, { useState, useEffect, useMemo } from 'react';
import { Deal, FilterOptions, StoreName } from './types';
import { INITIAL_DEALS, STORES_INFO } from './data/initialDeals';
import { TelegramBanner } from './components/TelegramBanner';
import { StatsBar } from './components/StatsBar';
import { Header } from './components/Header';
import { StoreFilterBar } from './components/StoreFilterBar';
import { CategoryNav } from './components/CategoryNav';
import { DealCard } from './components/DealCard';
import { DealDetailPage } from './components/DealDetailPage';
import { DealModal } from './components/DealModal';
import { AiLinkAnalyzerModal } from './components/AiLinkAnalyzerModal';
import { PostDealModal } from './components/PostDealModal';
import { PriceAlertModal } from './components/PriceAlertModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { AdminDashboard } from './components/AdminDashboard';
import { MobileLootAlertModal } from './components/MobileLootAlertModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { Flame, Sparkles, Filter, RefreshCw, ShoppingBag, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function App() {
  // Deals State with Node.js Database Backend + Local Storage Fallback
  const [deals, setDeals] = useState<Deal[]>(() => {
    try {
      const saved = localStorage.getItem('monday_bazaar_user_deals') || localStorage.getItem('dealsified_user_deals');
      if (saved) {
        const userDeals = JSON.parse(saved);
        return [...userDeals, ...INITIAL_DEALS];
      }
    } catch (e) {
      console.error("Failed to load user deals:", e);
    }
    return INITIAL_DEALS;
  });

  // Fetch initial deals from Node.js database endpoint & auto-migrate localStorage data
  useEffect(() => {
    const syncLocalStorageToDb = async () => {
      try {
        const rawUserDeals = localStorage.getItem('monday_bazaar_user_deals') || localStorage.getItem('dealsified_user_deals');
        const rawConfigs = localStorage.getItem('monday_bazaar_affiliate_configs');
        const localDeals = rawUserDeals ? JSON.parse(rawUserDeals) : [];
        const localAffiliateConfigs = rawConfigs ? JSON.parse(rawConfigs) : {};

        // Migrate local items to server database
        if ((Array.isArray(localDeals) && localDeals.length > 0) || Object.keys(localAffiliateConfigs).length > 0) {
          await fetch('/api/migrate-localstorage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ localDeals, affiliateConfigs: localAffiliateConfigs })
          });
        }
      } catch (e) {
        console.warn('LocalStorage auto-sync notice:', e);
      }

      // Fetch all persisted database deals
      fetch('/api/deals')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.deals) && data.deals.length > 0) {
            setDeals(data.deals);
          }
        })
        .catch(err => console.log('Database fetch fallback to client cache:', err));
    };

    syncLocalStorageToDb();
  }, []);

  // Watchlist State
  const [savedDealIds, setSavedDealIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('monday_bazaar_saved_ids') || localStorage.getItem('dealsified_saved_ids');
      return saved ? JSON.parse(saved) : ['deal-1', 'deal-3'];
    } catch {
      return ['deal-1', 'deal-3'];
    }
  });

  useEffect(() => {
    localStorage.setItem('monday_bazaar_saved_ids', JSON.stringify(savedDealIds));
  }, [savedDealIds]);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All',
    store: 'All',
    searchQuery: '',
    sortBy: 'hot',
    onlyLootDeals: false,
    onlyCoupons: false,
  });

  // Global Toast Messages State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [dealForAlert, setDealForAlert] = useState<Deal | null>(null);
  const [isAiInspectorOpen, setIsAiInspectorOpen] = useState(false);
  const [isPostDealOpen, setIsPostDealOpen] = useState(false);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);
  
  // Admin Route State
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(() => {
    return window.location.hash === '#admin' || window.location.pathname === '/admin';
  });

  useEffect(() => {
    const handleHashChange = () => {
      setIsAdminOpen(window.location.hash === '#admin' || window.location.pathname === '/admin');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleOpenAdmin = () => {
    window.location.hash = 'admin';
    setIsAdminOpen(true);
  };

  const handleCloseAdmin = () => {
    if (window.location.hash === '#admin') {
      window.location.hash = '';
    }
    setIsAdminOpen(false);
  };

  // Voting Handler
  const handleVote = (dealId: string, type: 'up' | 'down') => {
    setDeals(prevDeals =>
      prevDeals.map(d => {
        if (d.id !== dealId) return d;

        const currentVote = d.userVoted;
        let newUpvotes = d.upvotes;
        let newDownvotes = d.downvotes;
        let newVote: 'up' | 'down' | undefined = type;

        if (currentVote === type) {
          // Toggle off
          newVote = undefined;
          if (type === 'up') newUpvotes -= 1;
          else newDownvotes -= 1;
        } else {
          if (currentVote === 'up') newUpvotes -= 1;
          if (currentVote === 'down') newDownvotes -= 1;

          if (type === 'up') newUpvotes += 1;
          if (type === 'down') newDownvotes += 1;
        }

        return {
          ...d,
          upvotes: Math.max(0, newUpvotes),
          downvotes: Math.max(0, newDownvotes),
          userVoted: newVote,
        };
      })
    );

    // Sync vote with Node.js Database backend
    fetch(`/api/deals/${dealId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type })
    }).catch(err => console.error('Failed to sync vote to DB:', err));
  };

  // Toggle Save Watchlist
  const handleToggleSave = (deal: Deal) => {
    setSavedDealIds(prev =>
      prev.includes(deal.id) ? prev.filter(id => id !== deal.id) : [...prev, deal.id]
    );
  };

  // Add Comment Handler
  const handleAddComment = (dealId: string, text: string) => {
    setDeals(prevDeals =>
      prevDeals.map(d => {
        if (d.id !== dealId) return d;
        const newComment = {
          id: 'c_' + Date.now(),
          userName: 'Community_User',
          text,
          timestamp: 'Just now',
          upvotes: 0,
        };
        const updatedComments = [newComment, ...(d.comments || [])];
        const updatedDeal = {
          ...d,
          comments: updatedComments,
          commentsCount: updatedComments.length,
        };
        if (selectedDeal?.id === dealId) {
          setSelectedDeal(updatedDeal);
        }

        // Sync comment with Node.js Database backend
        fetch(`/api/deals/${dealId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ comments: updatedComments, commentsCount: updatedComments.length })
        }).catch(err => console.error('Failed to update deal comments in DB:', err));

        return updatedDeal;
      })
    );
  };

  // Update Deal Handler (from Admin)
  const handleUpdateDeal = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));

    // Sync update to Node.js Database backend
    fetch(`/api/deals/${updatedDeal.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDeal)
    }).catch(err => console.error('Failed to update deal in DB:', err));

    try {
      const saved = localStorage.getItem('monday_bazaar_user_deals') || localStorage.getItem('dealsified_user_deals');
      const userDeals: Deal[] = saved ? JSON.parse(saved) : [];
      const updatedUserDeals = userDeals.map(d => d.id === updatedDeal.id ? updatedDeal : d);
      localStorage.setItem('monday_bazaar_user_deals', JSON.stringify(updatedUserDeals));
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Deal Handler
  const handleDeleteDeal = (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    setDeals(prev => prev.filter(d => d.id !== dealId));

    // Sync deletion to Node.js Database backend
    fetch(`/api/deals/${dealId}`, {
      method: 'DELETE'
    }).then(res => res.json()).then(data => {
      addToast({
        type: 'success',
        title: 'Deal Deleted',
        message: targetDeal ? `"${targetDeal.title}" was removed from database.` : 'Deal removed from database.'
      });
    }).catch(err => {
      console.error('Failed to delete deal from DB:', err);
    });

    try {
      const saved = localStorage.getItem('monday_bazaar_user_deals') || localStorage.getItem('dealsified_user_deals');
      if (saved) {
        const userDeals: Deal[] = JSON.parse(saved);
        const filtered = userDeals.filter(d => d.id !== dealId);
        localStorage.setItem('monday_bazaar_user_deals', JSON.stringify(filtered));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Add New Deal Handler with Duplicate Check
  const handleAddDeal = async (newDealData: Partial<Deal>): Promise<{ success: boolean; error?: string; deal?: Deal }> => {
    // 1. Client-side duplicate check
    const titleLower = (newDealData.title || '').trim().toLowerCase();
    const urlLower = (newDealData.dealUrl || '').trim().toLowerCase();

    const existingLocal = deals.find(d => 
      (titleLower && d.title.trim().toLowerCase() === titleLower) ||
      (urlLower && urlLower !== 'https://www.amazon.in' && urlLower !== 'https://amazon.in' && d.dealUrl.trim().toLowerCase() === urlLower)
    );

    if (existingLocal) {
      const errText = `Duplicate Deal Error: A deal with this title or link already exists ("${existingLocal.title}")!`;
      addToast({
        type: 'error',
        title: 'Duplicate Deal Detected',
        message: errText
      });
      return { success: false, error: errText };
    }

    const fullDeal: Deal = {
      id: newDealData.id || ('deal_' + Date.now()),
      title: newDealData.title || 'New Bargain Deal',
      description: newDealData.description || 'Discovered offer',
      store: newDealData.store || 'Amazon',
      category: newDealData.category || 'Electronics & Laptops',
      originalPrice: newDealData.originalPrice || 1000,
      dealPrice: newDealData.dealPrice || 500,
      discountPercentage: newDealData.discountPercentage || 50,
      couponCode: newDealData.couponCode,
      imageUrl: newDealData.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      dealUrl: newDealData.dealUrl || 'https://www.amazon.in',
      isLootDeal: newDealData.isLootDeal ?? false,
      isVerified: true,
      upvotes: newDealData.upvotes || 1,
      downvotes: newDealData.downvotes || 0,
      aiScore: newDealData.aiScore || 85,
      aiVerdict: newDealData.aiVerdict || 'Community submitted price drop verified.',
      aiPros: newDealData.aiPros || ['Substantial discount off MRP', 'Community verified link'],
      aiCons: newDealData.aiCons || ['Check store delivery pin code before checkout'],
      postedAt: 'Just now',
      priceHistory: newDealData.priceHistory || [
        { date: 'Yesterday', price: newDealData.originalPrice || 1000 },
        { date: 'Today', price: newDealData.dealPrice || 500 }
      ],
      commentsCount: 0,
      comments: [],
      viewsCount: 1,
      postedBy: newDealData.postedBy || 'You'
    };

    try {
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullDeal)
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        const errMsg = data.error || data.message || 'Duplicate deal detected in database.';
        addToast({
          type: 'error',
          title: 'Duplicate Deal Blocked',
          message: errMsg
        });
        return { success: false, error: errMsg };
      }

      setDeals(prev => [data.deal || fullDeal, ...prev]);

      addToast({
        type: 'success',
        title: 'Deal Published Successfully',
        message: `"${fullDeal.title}" has been added to the live catalog.`
      });

      try {
        const saved = localStorage.getItem('dealsified_user_deals');
        const userDeals = saved ? JSON.parse(saved) : [];
        localStorage.setItem('dealsified_user_deals', JSON.stringify([data.deal || fullDeal, ...userDeals]));
      } catch (e) {
        console.error(e);
      }

      return { success: true, deal: data.deal || fullDeal };
    } catch (err: any) {
      setDeals(prev => [fullDeal, ...prev]);
      addToast({
        type: 'success',
        title: 'Deal Added',
        message: `"${fullDeal.title}" added to catalog.`
      });
      return { success: true, deal: fullDeal };
    }
  };

  // Filter & Sort Calculations
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      // Inactive filter - hide inactive deals from storefront
      if (deal.isActive === false) return false;

      // Category filter
      if (filters.category !== 'All' && deal.category !== filters.category) return false;

      // Store filter
      if (filters.store !== 'All' && deal.store !== filters.store) return false;

      // Loot Deals filter
      if (filters.onlyLootDeals && !deal.isLootDeal) return false;

      // Coupon Codes filter
      if (filters.onlyCoupons && !deal.couponCode) return false;

      // Search Query filter
      if (filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase();
        const matchTitle = deal.title.toLowerCase().includes(query);
        const matchStore = deal.store.toLowerCase().includes(query);
        const matchCategory = deal.category.toLowerCase().includes(query);
        const matchDesc = deal.description.toLowerCase().includes(query);
        const matchCoupon = deal.couponCode?.toLowerCase().includes(query);
        if (!matchTitle && !matchStore && !matchCategory && !matchDesc && !matchCoupon) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'hot') {
        return (b.upvotes + b.aiScore) - (a.upvotes + a.aiScore);
      }
      if (filters.sortBy === 'discount') {
        return b.discountPercentage - a.discountPercentage;
      }
      if (filters.sortBy === 'ai_score') {
        return b.aiScore - a.aiScore;
      }
      if (filters.sortBy === 'price_low') {
        return a.dealPrice - b.dealPrice;
      }
      if (filters.sortBy === 'price_high') {
        return b.dealPrice - a.dealPrice;
      }
      if (filters.sortBy === 'newest') {
        return b.id.localeCompare(a.id);
      }
      return 0;
    });
  }, [deals, filters]);

  // Counts by Store
  const storeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach(d => {
      counts[d.store] = (counts[d.store] || 0) + 1;
    });
    return counts;
  }, [deals]);

  // Counts by Category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: deals.length };
    deals.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [deals]);

  const savedDeals = useMemo(() => {
    return deals.filter(d => savedDealIds.includes(d.id));
  }, [deals, savedDealIds]);

  // Render Standalone Admin Module
  if (isAdminOpen) {
    return (
      <div className="min-h-screen bg-slate-100 font-sans text-slate-900 selection:bg-orange-500 selection:text-white">
        <AdminDashboard
          deals={deals}
          onAddDeal={handleAddDeal}
          onUpdateDeal={handleUpdateDeal}
          onDeleteDeal={handleDeleteDeal}
          onCloseAdmin={handleCloseAdmin}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white">
      
      {/* Top Banner & Stats */}
      <TelegramBanner />
      <StatsBar />

      {/* Main Header Navbar */}
      <Header
        filters={filters}
        setFilters={setFilters}
        savedDealsCount={savedDealIds.length}
        onOpenSavedDeals={() => setIsWatchlistOpen(true)}
        onOpenPostDeal={() => setIsPostDealOpen(true)}
        onOpenAiInspector={() => setIsAiInspectorOpen(true)}
        onOpenAdmin={handleOpenAdmin}
        totalDealsCount={deals.length}
        onLogoClick={() => {
          setSelectedDeal(null);
          handleCloseAdmin();
        }}
      />

      {selectedDeal ? (
        /* Dedicated Full-Page View for Selected Deal */
        <main className="flex-1">
          <DealDetailPage
            deal={selectedDeal}
            onBack={() => setSelectedDeal(null)}
            onVote={handleVote}
            onAddComment={handleAddComment}
            onOpenPriceAlert={(d) => setDealForAlert(d)}
            isSaved={savedDealIds.includes(selectedDeal.id)}
            onToggleSave={handleToggleSave}
            allDeals={deals}
            onSelectDeal={(d) => {
              setSelectedDeal(d);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </main>
      ) : (
        /* Main Catalog Feed View */
        <>
          {/* E-Commerce Store Selector */}
          <StoreFilterBar
            selectedStore={filters.store}
            onSelectStore={(store) => setFilters(prev => ({ ...prev, store }))}
            dealsCountByStore={storeCounts}
          />

          {/* Categories & Sorting Toolbar */}
          <CategoryNav
            filters={filters}
            setFilters={setFilters}
            categoryCounts={categoryCounts}
          />

          {/* Main Container Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            
            {/* Active Filter Indicators Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <span className="text-slate-500">Showing</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-800 font-extrabold rounded-md">
                  {filteredDeals.length} Deals
                </span>
                {filters.store !== 'All' && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                    Store: {filters.store}
                  </span>
                )}
                {filters.category !== 'All' && (
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md">
                    Category: {filters.category}
                  </span>
                )}
                {filters.searchQuery && (
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
                    Search: "{filters.searchQuery}"
                  </span>
                )}
              </div>

              <button
                onClick={() => setFilters({
                  category: 'All',
                  store: 'All',
                  searchQuery: '',
                  sortBy: 'hot',
                  onlyLootDeals: false,
                  onlyCoupons: false,
                })}
                className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset Filters
              </button>
            </div>

            {/* Deals Cards Grid */}
            {filteredDeals.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredDeals.map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onSelectDeal={(d) => {
                      setSelectedDeal(d);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onVote={handleVote}
                    isSaved={savedDealIds.includes(deal.id)}
                    onToggleSave={handleToggleSave}
                    onOpenPriceAlert={(d) => setDealForAlert(d)}
                  />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8 space-y-4 shadow-sm">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">No Deals Match Your Filters</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Try adjusting your search terms or store filters, or paste a deal link directly into our AI Inspector!
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setFilters({
                      category: 'All',
                      store: 'All',
                      searchQuery: '',
                      sortBy: 'hot',
                      onlyLootDeals: false,
                      onlyCoupons: false,
                    })}
                    className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    Clear All Filters
                  </button>

                  <button
                    onClick={() => setIsAiInspectorOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                    Inspect Any Link with AI
                  </button>
                </div>
              </div>
            )}

          </main>
        </>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 py-10 mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black">
                <Flame className="w-5 h-5 fill-white" />
              </div>
              <span className="text-lg font-black text-white tracking-tight">
                Monday <span className="text-orange-500">Bazaar</span>
              </span>
            </div>

            <p className="text-center md:text-right text-slate-400 max-w-md">
              Aggregating verified daily price drops, promotional coupons, and loot deals across Amazon, Flipkart, Myntra, Ajio, Croma, and 10+ top e-commerce platforms.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500">
            <p>© {new Date().getFullYear()} Monday Bazaar. All rights reserved. E-Commerce deals & coupons aggregator.</p>
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenAdmin}
                className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold hover:underline transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-orange-500" />
                <span>Admin Console</span>
              </button>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-400">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Deal Links
              </span>
              <span>•</span>
              <span className="text-slate-400">Powered by Gemini AI</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <AiLinkAnalyzerModal
        isOpen={isAiInspectorOpen}
        onClose={() => setIsAiInspectorOpen(false)}
        onPostAnalyzedDeal={handleAddDeal}
      />

      <PostDealModal
        isOpen={isPostDealOpen}
        onClose={() => setIsPostDealOpen(false)}
        onAddDeal={handleAddDeal}
      />

      <PriceAlertModal
        deal={dealForAlert}
        onClose={() => setDealForAlert(null)}
      />

      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        savedDeals={savedDeals}
        onSelectDeal={(d) => setSelectedDeal(d)}
        onRemoveSave={(id) => setSavedDealIds(prev => prev.filter(i => i !== id))}
      />

      {/* Mobile-Only Loot Alert Notification Popup */}
      <MobileLootAlertModal />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
