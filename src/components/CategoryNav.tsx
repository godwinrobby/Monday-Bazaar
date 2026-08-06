import React from 'react';
import { CategoryName, FilterOptions } from '../types';
import { 
  Grid, 
  Smartphone, 
  Laptop, 
  Headphones, 
  Shirt, 
  Home, 
  Gamepad2, 
  Sparkles, 
  Watch,
  Flame,
  ArrowUpDown,
  Zap,
  Ticket
} from 'lucide-react';

interface CategoryNavProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  categoryCounts: Record<string, number>;
}

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

export const CategoryNav: React.FC<CategoryNavProps> = ({
  filters,
  setFilters,
  categoryCounts,
}) => {
  return (
    <div id="category-and-sort-nav" className="bg-white border-b border-slate-200 py-3 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-3">
        
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = filters.category === cat.name;
            const count = categoryCounts[cat.name] || 0;

            return (
              <button
                key={cat.name}
                id={`cat-btn-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                onClick={() => setFilters(prev => ({ ...prev, category: cat.name }))}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all shrink-0 ${
                  isSelected
                    ? 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-500/20'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                <span>{cat.name}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Toggles and Sorting Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100 text-xs">
          
          {/* Quick Badges Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilters(prev => ({ ...prev, onlyLootDeals: !prev.onlyLootDeals }))}
              id="toggle-loot-deals-btn"
              className={`px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 border transition-all ${
                filters.onlyLootDeals
                  ? 'bg-red-500 text-white border-red-600 shadow-xs ring-2 ring-red-400/30'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>LOOT DEALS ONLY</span>
              {filters.onlyLootDeals && <span className="ml-1 text-[10px]">✕</span>}
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, onlyCoupons: !prev.onlyCoupons }))}
              id="toggle-coupons-btn"
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 border transition-all ${
                filters.onlyCoupons
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>With Coupon Codes</span>
              {filters.onlyCoupons && <span className="ml-1 text-[10px]">✕</span>}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              Sort By:
            </span>
            <select
              id="sort-deals-select"
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as FilterOptions['sortBy'] }))}
              className="bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 font-semibold rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="hot">🔥 Hot & Trending</option>
              <option value="discount">💥 Highest Discount %</option>
              <option value="ai_score">🧠 Highest AI Deal Score</option>
              <option value="price_low">💰 Price: Low to High</option>
              <option value="price_high">💎 Price: High to Low</option>
              <option value="newest">⚡ Newest Posted</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  );
};
