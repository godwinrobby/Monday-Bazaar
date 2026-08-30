import React, { useState } from 'react';
import { Deal, FilterOptions } from '../types';
import { StoreFilterBar } from '../components/StoreFilterBar';
import { CategoryNav } from '../components/CategoryNav';
import { MobileFilterDrawer } from '../components/MobileFilterDrawer';
import { DealCard } from '../components/DealCard';
import { RefreshCw, ShoppingBag, SlidersHorizontal, ChevronRight, Store, Grid, Flame, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DealsPageProps {
  deals: Deal[];
  isLoading: boolean;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  filteredDeals: Deal[];
  storeCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  savedDealIds: string[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

export const DealsPage: React.FC<DealsPageProps> = ({
  deals,
  isLoading,
  filters,
  setFilters,
  filteredDeals,
  storeCounts,
  categoryCounts,
  savedDealIds,
  onVote,
  onToggleSave,
  onOpenPriceAlert,
}) => {
  const navigate = useNavigate();
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const activeFiltersCount = 
    (filters.store !== 'All' ? 1 : 0) + 
    (filters.category !== 'All' ? 1 : 0) + 
    (filters.onlyLootDeals ? 1 : 0) + 
    (filters.onlyCoupons ? 1 : 0) + 
    (filters.searchQuery ? 1 : 0);

  return (
    <div className="space-y-3 sm:space-y-6">
      
      {/* Mobile-Only Filter & Sort Trigger Bar */}
      <div className="block md:hidden bg-white border-b border-slate-200/90 px-3 py-2 shadow-2xs sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMobileFilterOpen(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-2xl flex items-center gap-2 shrink-0 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <SlidersHorizontal className="w-4 h-4 text-orange-400" />
            <span>Filter & Sort</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Quick Active Filter Badges horizontal scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs">
            {filters.store !== 'All' && (
              <span 
                onClick={() => setIsMobileFilterOpen(true)}
                className="px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-full text-[11px] shrink-0 border border-slate-200 cursor-pointer flex items-center gap-1"
              >
                <span>Store: {filters.store}</span>
              </span>
            )}
            {filters.category !== 'All' && (
              <span 
                onClick={() => setIsMobileFilterOpen(true)}
                className="px-2.5 py-1 bg-orange-50 text-orange-800 font-bold rounded-full text-[11px] shrink-0 border border-orange-200 cursor-pointer flex items-center gap-1"
              >
                <span>{filters.category}</span>
              </span>
            )}
            {filters.onlyLootDeals && (
              <span 
                onClick={() => setIsMobileFilterOpen(true)}
                className="px-2.5 py-1 bg-red-100 text-red-800 font-black rounded-full text-[11px] shrink-0 border border-red-200 cursor-pointer"
              >
                🔥 Loot Deals
              </span>
            )}
            {filters.onlyCoupons && (
              <span 
                onClick={() => setIsMobileFilterOpen(true)}
                className="px-2.5 py-1 bg-amber-100 text-amber-900 font-bold rounded-full text-[11px] shrink-0 border border-amber-200 cursor-pointer"
              >
                🎟️ Coupons
              </span>
            )}
            {activeFiltersCount === 0 && (
              <button 
                onClick={() => setIsMobileFilterOpen(true)}
                className="text-[11px] text-slate-500 font-semibold whitespace-nowrap cursor-pointer hover:text-slate-800 flex items-center gap-1 py-1"
              >
                <span>All Stores & Categories ({deals.length})</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop-Only Top Filter Bars */}
      <div className="hidden md:block space-y-4">
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
      </div>

      {/* Mobile Filter Drawer Sidebar */}
      <MobileFilterDrawer
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        filters={filters}
        setFilters={setFilters}
        storeCounts={storeCounts}
        categoryCounts={categoryCounts}
        totalMatchingDeals={filteredDeals.length}
      />

      {/* Main Container Content */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        
        {/* Active Filter Indicators Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-2.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-700">
            <span className="text-slate-500 font-bold">Showing</span>
            <span className="px-2.5 py-1 bg-orange-100/80 text-orange-950 font-black rounded-lg text-xs">
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
            {filters.onlyLootDeals && (
              <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md font-bold">
                🔥 Loot Deals
              </span>
            )}
            {filters.onlyCoupons && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md">
                🎟️ Coupons Only
              </span>
            )}
          </div>

          <div>
            <button
              onClick={() => setFilters({
                category: 'All',
                store: 'All',
                searchQuery: '',
                sortBy: 'newest',
                onlyLootDeals: false,
                onlyCoupons: false,
              })}
              className="text-xs text-orange-600 font-extrabold hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-500" />
              Reset Filters
            </button>
          </div>
        </div>

        {/* Deals Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
                <div className="w-full h-44 bg-slate-100 rounded-2xl"></div>
                <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                <div className="flex justify-between items-center pt-2">
                  <div className="h-6 bg-slate-100 rounded w-20"></div>
                  <div className="h-8 bg-slate-100 rounded-xl w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredDeals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredDeals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSelectDeal={(d) => navigate(`/deal/${d.id}`)}
                onVote={onVote}
                isSaved={savedDealIds.includes(deal.id)}
                onToggleSave={onToggleSave}
                onOpenPriceAlert={onOpenPriceAlert}
              />
            ))}
          </div>
        ) : deals.length === 0 ? (
          /* Database Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">No Live Deals in Database</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your Supabase database is connected and active. Post your first deal to get started!
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => setFilters({
                  category: 'All',
                  store: 'All',
                  searchQuery: '',
                  sortBy: 'newest',
                  onlyLootDeals: false,
                  onlyCoupons: false,
                })}
                className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : (
          /* Filter Empty State */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-lg mx-auto my-8 space-y-4 shadow-sm">
            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">No Deals Match Your Filters</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Try adjusting your search terms or store filters to find more deals.
            </p>
            <div className="flex justify-center gap-3 pt-2">
              <button
                onClick={() => setFilters({
                  category: 'All',
                  store: 'All',
                  searchQuery: '',
                  sortBy: 'newest',
                  onlyLootDeals: false,
                  onlyCoupons: false,
                })}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
