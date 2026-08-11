import React from 'react';
import { Deal, FilterOptions } from '../types';
import { StoreFilterBar } from '../components/StoreFilterBar';
import { CategoryNav } from '../components/CategoryNav';
import { DealCard } from '../components/DealCard';
import { RefreshCw, ShoppingBag, Sparkles } from 'lucide-react';
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
  onOpenPostDeal: () => void;
  onOpenAiInspector: () => void;
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
  onOpenPostDeal,
  onOpenAiInspector,
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 sm:space-y-6">
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
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        
        {/* Active Filter Indicators Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-white p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-700">
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

          <button
            onClick={() => setFilters({
              category: 'All',
              store: 'All',
              searchQuery: '',
              sortBy: 'hot',
              onlyLootDeals: false,
              onlyCoupons: false,
            })}
            className="text-xs text-orange-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            Reset Filters
          </button>
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
              Your MySQL database is connected and active. Import live deals directly from Amazon, Flipkart, or Myntra using our Admin Importer or post your first deal!
            </p>
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <button
                onClick={() => navigate('/admin')}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl hover:bg-blue-700 transition-colors"
              >
                Open Admin & Import Deals
              </button>
              <button
                onClick={onOpenPostDeal}
                className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors"
              >
                Post a Deal
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
                onClick={onOpenAiInspector}
                className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                Inspect Any Link with AI
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
