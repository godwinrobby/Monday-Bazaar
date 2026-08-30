import React from 'react';
import { CategoryName, FilterOptions } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { 
  SlidersHorizontal, 
  X, 
  RefreshCw, 
  Check, 
  Flame, 
  Ticket, 
  Store, 
  Grid, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Watch, 
  Shirt, 
  Home, 
  Gamepad2, 
  Sparkles, 
  ArrowUpDown 
} from 'lucide-react';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  storeCounts: Record<string, number>;
  categoryCounts: Record<string, number>;
  totalMatchingDeals: number;
}

const STORES = ['All', 'Amazon', 'Flipkart', 'Myntra', 'Snapdeal', 'Tata CLiQ', 'Croma', 'Reliance Digital', 'AJIO'];

const CATEGORIES: { name: CategoryName; icon: React.FC<{ className?: string }> }[] = [
  { name: 'All', icon: Grid },
  { name: 'Mobiles & Tablets', icon: Smartphone },
  { name: 'Electronics & Laptops', icon: Laptop },
  { name: 'Audio & Headphones', icon: Headphones },
  { name: 'Smartwatches', icon: Watch },
  { name: 'Fashion & Apparel', icon: Shirt },
  { name: 'Home & Kitchen', icon: Home },
  { name: 'Gaming & Accessories', icon: Gamepad2 },
  { name: 'Beauty & Grooming', icon: Sparkles },
];

const SORT_OPTIONS: { id: FilterOptions['sortBy']; label: string; icon: string }[] = [
  { id: 'hot', label: 'Hot & Trending', icon: '🔥' },
  { id: 'discount', label: 'Highest Discount %', icon: '💥' },
  { id: 'ai_score', label: 'Highest AI Deal Score', icon: '🧠' },
  { id: 'price_low', label: 'Price: Low to High', icon: '💰' },
  { id: 'price_high', label: 'Price: High to Low', icon: '💎' },
  { id: 'newest', label: 'Newest Posted', icon: '⚡' },
];

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  setFilters,
  storeCounts,
  categoryCounts,
  totalMatchingDeals,
}) => {
  if (!isOpen) return null;

  const activeFiltersCount = 
    (filters.store !== 'All' ? 1 : 0) + 
    (filters.category !== 'All' ? 1 : 0) + 
    (filters.onlyLootDeals ? 1 : 0) + 
    (filters.onlyCoupons ? 1 : 0) + 
    (filters.searchQuery ? 1 : 0);

  const handleReset = () => {
    setFilters({
      category: 'All',
      store: 'All',
      searchQuery: '',
      sortBy: 'newest',
      onlyLootDeals: false,
      onlyCoupons: false,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end md:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slide-left overflow-hidden">
        
        {/* Drawer Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm flex items-center gap-2">
                Filter & Sort Deals
                {activeFiltersCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black">
                    {activeFiltersCount} Active
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">Refine by platform, category, or sorting</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-orange-400 font-bold hover:underline flex items-center gap-1 cursor-pointer pr-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {/* 1. FILTER BY E-COMMERCE PLATFORM */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span>Filter by E-Commerce Platform</span>
              </label>
              <span className="text-[11px] text-slate-400 font-bold">
                {filters.store}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {STORES.map((store) => {
                const info = (STORES_INFO as any)[store] || { accentColor: '#334155', badgeBg: 'bg-slate-100' };
                const isSelected = filters.store === store;
                const count = store === 'All' 
                  ? (Object.values(storeCounts) as number[]).reduce((a, b) => a + b, 0)
                  : (storeCounts[store] || 0);

                return (
                  <button
                    key={store}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, store }))}
                    className={`p-2.5 rounded-2xl text-xs font-bold border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-orange-500/30'
                        : 'bg-slate-50/80 text-slate-800 border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {store !== 'All' ? (
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: info.accentColor }} />
                      ) : (
                        <Store className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                      )}
                      <span className="truncate">{store === 'All' ? 'All Stores' : store}</span>
                    </div>

                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isSelected ? 'bg-slate-700 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 2. CATEGORY SELECTION */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Grid className="w-3.5 h-3.5 text-slate-400" />
                <span>Categories</span>
              </label>
              <span className="text-[11px] text-slate-400 font-bold">
                {filters.category}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-1.5">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = filters.category === cat.name;
                const count = categoryCounts[cat.name] || 0;

                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, category: cat.name }))}
                    className={`p-2.5 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                        : 'bg-slate-50/80 text-slate-700 border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                      <span className="truncate">{cat.name}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                      }`}>
                        {count} Deals
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 3. SPECIAL BADGES & TOGGLES */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-red-500" />
              <span>Deal Badges & Coupons</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, onlyLootDeals: !prev.onlyLootDeals }))}
                className={`p-3 rounded-2xl font-black text-xs border transition-all flex items-center justify-between cursor-pointer ${
                  filters.onlyLootDeals
                    ? 'bg-red-500 text-white border-red-600 shadow-sm'
                    : 'bg-pink-50/60 text-red-600 border-red-200/80 hover:bg-red-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${filters.onlyLootDeals ? 'fill-white text-white' : 'fill-red-500 text-red-500'}`} />
                  <span>LOOT DEALS ONLY</span>
                </div>
                {filters.onlyLootDeals ? <Check className="w-4 h-4 text-white" /> : <span className="text-[10px] text-red-400 font-bold">Tap to filter</span>}
              </button>

              <button
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, onlyCoupons: !prev.onlyCoupons }))}
                className={`p-3 rounded-2xl font-bold text-xs border transition-all flex items-center justify-between cursor-pointer ${
                  filters.onlyCoupons
                    ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50/60 text-amber-800 border-amber-200/80 hover:bg-amber-100/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>With Coupon Codes</span>
                </div>
                {filters.onlyCoupons ? <Check className="w-4 h-4 text-white" /> : <span className="text-[10px] text-amber-600 font-bold">Tap to filter</span>}
              </button>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* 4. SORT BY */}
          <div className="space-y-2.5 pb-6">
            <label className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
              <span>Sort Deals By</span>
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {SORT_OPTIONS.map((opt) => {
                const isSelected = filters.sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, sortBy: opt.id }))}
                    className={`p-3 rounded-2xl text-xs font-bold border transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50/80 text-slate-700 border-slate-200/90 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-sm">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-orange-400 font-black" />}
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-white border-t border-slate-200/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl transition-all shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Show {totalMatchingDeals} Deals</span>
          </button>
        </div>

      </div>
    </div>
  );
};
