import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Deal, FilterOptions } from './types';
import { supabaseDb } from './db/supabaseDb';
import { applyServerStoreLogos, getStoreLogos } from './utils/storeLogos';
import { Flame, ShieldCheck } from 'lucide-react';

const TelegramBanner = lazy(() => import('./components/TelegramBanner').then(m => ({ default: m.TelegramBanner })));
const StatsBar = lazy(() => import('./components/StatsBar').then(m => ({ default: m.StatsBar })));
const Header = lazy(() => import('./components/Header').then(m => ({ default: m.Header })));
const Navbar = lazy(() => import('./components/Navbar').then(m => ({ default: m.Navbar })));

const DealsPage = lazy(() => import('./pages/DealsPage').then(m => ({ default: m.DealsPage })));
const DealDetailsRoute = lazy(() => import('./pages/DealDetailsRoute').then(m => ({ default: m.DealDetailsRoute })));
const LootDealsPage = lazy(() => import('./pages/LootDealsPage').then(m => ({ default: m.LootDealsPage })));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const StoresPage = lazy(() => import('./pages/StoresPage').then(m => ({ default: m.StoresPage })));
const WatchlistPage = lazy(() => import('./pages/WatchlistPage').then(m => ({ default: m.WatchlistPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));

const EcShopPage = lazy(() => import('./pages/EcShopPage').then(m => ({ default: m.EcShopPage })));
const EcProductPage = lazy(() => import('./pages/EcProductPage').then(m => ({ default: m.EcProductPage })));
const EcCartPage = lazy(() => import('./pages/EcCartPage').then(m => ({ default: m.EcCartPage })));
const EcCheckoutPage = lazy(() => import('./pages/EcCheckoutPage').then(m => ({ default: m.EcCheckoutPage })));
const EcCheckoutConfirmationPage = lazy(() => import('./pages/EcCheckoutConfirmationPage').then(m => ({ default: m.EcCheckoutConfirmationPage })));
const EcOrdersPage = lazy(() => import('./pages/EcOrdersPage').then(m => ({ default: m.EcOrdersPage })));
const EcOrderDetailPage = lazy(() => import('./pages/EcOrderDetailPage').then(m => ({ default: m.EcOrderDetailPage })));
const EcTrackingPage = lazy(() => import('./pages/EcTrackingPage').then(m => ({ default: m.EcTrackingPage })));

import { PriceAlertModal } from './components/PriceAlertModal';
import { WatchlistDrawer } from './components/WatchlistDrawer';
import { ToastContainer, ToastMessage } from './components/Toast';

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Deals State fetched directly from Supabase Database
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch initial deals from Supabase database on mount
  useEffect(() => {
    setIsLoading(true);
    supabaseDb.getDeals()
      .then(fetchedDeals => {
        if (Array.isArray(fetchedDeals)) {
          setDeals(fetchedDeals);
        }
      })
      .catch(err => console.error('Supabase deals fetch error:', err))
      .finally(() => setIsLoading(false));
  }, []);

  // Load persisted store images (store -> logo) from the backend so fetched images
  // apply site-wide for all users. Bumping a tick forces a re-render after seeding.
  const [, setStoreImagesTick] = useState(0);
  useEffect(() => {
    applyServerStoreLogos(getStoreLogos());
    fetch('/api/store-images')
      .then(r => (r.ok ? r.json() : null))
      .then((data: any) => {
        if (data && data.success && data.images) {
          applyServerStoreLogos(data.images);
        }
      })
      .catch(err => console.error('Store images fetch error:', err))
      .finally(() => setStoreImagesTick(t => t + 1));
  }, []);

  // Watchlist State (in-memory)
  const [savedDealIds, setSavedDealIds] = useState<string[]>([]);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'All',
    store: 'All',
    searchQuery: '',
    sortBy: 'newest',
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

  const [dealForAlert, setDealForAlert] = useState<Deal | null>(null);
  const [isWatchlistOpen, setIsWatchlistOpen] = useState(false);

  const LoadingFallback = () => (
    <div className="flex items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
    </div>
  );

  const NavLoadingFallback = () => (
    <div className="animate-pulse bg-slate-800/50 h-12 w-full"></div>
  );

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

    // Sync vote with Supabase Database
    supabaseDb.voteDeal(dealId, type).catch(err => console.error('Failed to sync vote to Supabase:', err));
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

        // Sync comment with Supabase Database
        supabaseDb.updateDeal(dealId, { comments: updatedComments, commentsCount: updatedComments.length })
          .catch(err => console.error('Failed to update deal comments in Supabase:', err));

        return updatedDeal;
      })
    );
  };

  // Update Deal Handler (from Admin)
  const handleUpdateDeal = (updatedDeal: Deal) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));

    // Sync update to Supabase Database
    supabaseDb.updateDeal(updatedDeal.id, updatedDeal)
      .catch(err => console.error('Failed to update deal in Supabase:', err));
  };

  // Delete Deal Handler
  const handleDeleteDeal = (dealId: string) => {
    const targetDeal = deals.find(d => d.id === dealId);
    setDeals(prev => prev.filter(d => d.id !== dealId));

    // Sync deletion to Supabase Database
    supabaseDb.deleteDeal(dealId)
      .then(() => {
        addToast({
          type: 'success',
          title: 'Deal Deleted',
          message: targetDeal ? `"${targetDeal.title}" was removed from database.` : 'Deal removed from database.'
        });
      })
      .catch(err => {
        console.error('Failed to delete deal from Supabase:', err);
      });
  };

  // Add New Deal Handler with Duplicate Check
  const handleAddDeal = async (newDealData: Partial<Deal>): Promise<{ success: boolean; error?: string; deal?: Deal }> => {
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
      createdAt: new Date().toISOString(),
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
      const addedDeal = await supabaseDb.addDeal(fullDeal);
      setDeals(prev => [addedDeal || fullDeal, ...prev]);

      addToast({
        type: 'success',
        title: 'Deal Published Successfully',
        message: `"${fullDeal.title}" has been added to the live catalog.`
      });

      return { success: true, deal: addedDeal || fullDeal };
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

  // Filter & Sort Calculations for DealsPage
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      if (deal.isActive === false) return false;
      if (filters.category !== 'All' && deal.category !== filters.category) return false;
      if (filters.store !== 'All' && deal.store !== filters.store) return false;
      if (filters.onlyLootDeals && !deal.isLootDeal) return false;
      if (filters.onlyCoupons && !deal.couponCode) return false;

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
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      }
      return 0;
    });
  }, [deals, filters]);

  // Counts by Store (only Active deals)
  const storeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    deals.forEach(d => {
      if (d.isActive === false) return;
      counts[d.store] = (counts[d.store] || 0) + 1;
    });
    return counts;
  }, [deals]);

  // Counts by Category (only Active deals)
  const categoryCounts = useMemo(() => {
    const activeDeals = deals.filter(d => d.isActive !== false);
    const counts: Record<string, number> = { All: activeDeals.length };
    activeDeals.forEach(d => {
      counts[d.category] = (counts[d.category] || 0) + 1;
    });
    return counts;
  }, [deals]);

  const savedDeals = useMemo(() => {
    return deals.filter(d => savedDealIds.includes(d.id));
  }, [deals, savedDealIds]);

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col selection:bg-orange-500 selection:text-white max-w-full overflow-x-hidden">
      
      {/* Show Banners, Header & Navbar on non-admin routes */}
      {!isAdminRoute && (
        <Suspense fallback={<NavLoadingFallback />}>
          <TelegramBanner />
          <StatsBar />
          <Header
            filters={filters}
            setFilters={setFilters}
            savedDealsCount={savedDealIds.length}
            onOpenSavedDeals={() => setIsWatchlistOpen(true)}
            totalDealsCount={deals.length}
          />
          <Navbar savedCount={savedDealIds.length} />
        </Suspense>
      )}

      {/* Primary Router Views */}
      <div className="flex-1">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <DealsPage
                  deals={deals}
                  isLoading={isLoading}
                  filters={filters}
                  setFilters={setFilters}
                  filteredDeals={filteredDeals}
                  storeCounts={storeCounts}
                  categoryCounts={categoryCounts}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/deal/:id"
              element={
                <DealDetailsRoute
                  deals={deals}
                  onVote={handleVote}
                  onAddComment={handleAddComment}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                  savedDealIds={savedDealIds}
                  onToggleSave={handleToggleSave}
                />
              }
            />
            <Route
              path="/loot"
              element={
                <LootDealsPage
                  deals={deals}
                  isLoading={isLoading}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/categories"
              element={
                <CategoriesPage
                  deals={deals}
                  isLoading={isLoading}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/category/:categoryName"
              element={
                <CategoriesPage
                  deals={deals}
                  isLoading={isLoading}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/stores"
              element={
                <StoresPage
                  deals={deals}
                  isLoading={isLoading}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/store/:storeName"
              element={
                <StoresPage
                  deals={deals}
                  isLoading={isLoading}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                />
              }
            />
            <Route
              path="/watchlist"
              element={
                <WatchlistPage
                  deals={deals}
                  savedDealIds={savedDealIds}
                  onVote={handleVote}
                  onToggleSave={handleToggleSave}
                  onOpenPriceAlert={(d) => setDealForAlert(d)}
                  onClearWatchlist={() => setSavedDealIds([])}
                />
              }
            />
                                    <Route
              path="/admin/*"
              element={
                <AdminPage
                  deals={deals}
                  onAddDeal={handleAddDeal}
                  onUpdateDeal={handleUpdateDeal}
                  onDeleteDeal={handleDeleteDeal}
                />
              }
            />
            {/* E-Commerce Routes (User App) */}
            <Route path="/shop" element={<EcShopPage />} />
            <Route path="/shop/:id" element={<EcProductPage />} />
            <Route path="/cart" element={<EcCartPage />} />
            <Route path="/checkout" element={<EcCheckoutPage />} />
            <Route path="/checkout/confirmation" element={<EcCheckoutConfirmationPage />} />
            <Route path="/orders" element={<EcOrdersPage />} />
            <Route path="/orders/:id" element={<EcOrderDetailPage />} />
            <Route path="/orders/:id/track" element={<EcTrackingPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>

      {/* Footer */}
      {!isAdminRoute && (
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
                                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Deal Links
                </span>
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* Modals & Drawers */}
      <PriceAlertModal
        deal={dealForAlert}
        onClose={() => setDealForAlert(null)}
      />

      <WatchlistDrawer
        isOpen={isWatchlistOpen}
        onClose={() => setIsWatchlistOpen(false)}
        savedDeals={savedDeals}
        onSelectDeal={(d) => {
          setIsWatchlistOpen(false);
        }}
        onRemoveSave={(id) => setSavedDealIds(prev => prev.filter(i => i !== id))}
      />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={handleDismissToast} />

    </div>
  );
}
