import React, { useRef, useState, useEffect } from 'react';
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
  Ticket,
  ChevronLeft,
  ChevronRight
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    scrollRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <div id="category-and-sort-nav" className="bg-white border-b border-slate-200 py-2.5 sm:py-3 shadow-2xs w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-2.5 sm:space-y-3">
        
        {/* Category Pills Container */}
        <div className="relative">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Swipeable Categories */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth select-none cursor-grab active:cursor-grabbing"
          >
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = filters.category === cat.name;
              const count = categoryCounts[cat.name] || 0;

              return (
                <button
                  key={cat.name}
                  id={`cat-btn-${cat.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  onClick={() => setFilters(prev => ({ ...prev, category: cat.name }))}
                  className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border transition-all shrink-0 ${
                    isSelected
                      ? 'bg-orange-500 text-white border-orange-600 shadow-sm shadow-orange-500/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                  <span className="whitespace-nowrap">{cat.name}</span>
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

          {/* Scroll Right Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/90 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Toggles and Sorting Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          
          {/* Quick Badges Toggles */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setFilters(prev => ({ ...prev, onlyLootDeals: !prev.onlyLootDeals }))}
              id="toggle-loot-deals-btn"
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-bold flex items-center gap-1.5 border transition-all shrink-0 text-[11px] sm:text-xs ${
                filters.onlyLootDeals
                  ? 'bg-red-500 text-white border-red-600 shadow-xs ring-2 ring-red-400/30'
                  : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
              }`}
            >
              <Flame className="w-3.5 h-3.5 fill-current shrink-0" />
              <span>LOOT DEALS ONLY</span>
              {filters.onlyLootDeals && <span className="ml-1 text-[10px]">✕</span>}
            </button>

            <button
              onClick={() => setFilters(prev => ({ ...prev, onlyCoupons: !prev.onlyCoupons }))}
              id="toggle-coupons-btn"
              className={`px-2.5 sm:px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 border transition-all shrink-0 text-[11px] sm:text-xs ${
                filters.onlyCoupons
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Ticket className="w-3.5 h-3.5 shrink-0" />
              <span>With Coupon Codes</span>
              {filters.onlyCoupons && <span className="ml-1 text-[10px]">✕</span>}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <span className="text-slate-500 font-medium flex items-center gap-1 text-[11px] sm:text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 shrink-0" />
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

