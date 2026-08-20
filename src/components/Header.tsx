import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Flame, Heart, X } from 'lucide-react';
import { FilterOptions } from '../types';

interface HeaderProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  savedDealsCount: number;
  onOpenSavedDeals: () => void;
  totalDealsCount: number;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  setFilters,
  savedDealsCount,
  onOpenSavedDeals,
  totalDealsCount,
  onLogoClick,
}) => {
  const navigate = useNavigate();

  return (
    <header id="main-header-navbar" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 space-y-2 sm:space-y-0">
        
        {/* Main Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Logo */}
          <Link 
            to="/"
            onClick={onLogoClick} 
            className="flex items-center gap-2 sm:gap-3 shrink-0 cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform shrink-0">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-amber-200 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 leading-none">
                Monday <span className="text-orange-600">Bazaar</span>
              </span>
              <span className="hidden xs:inline-block text-[9px] sm:text-[10px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
                Amazon • Flipkart • Multi-Store
              </span>
            </div>
          </Link>

          {/* Search Bar - Desktop Only in Row 1 */}
          <div className="hidden sm:block flex-1 max-w-2xl min-w-0 relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                id="search-deals-input"
                value={filters.searchQuery}
                onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                placeholder="Search deals (e.g., iPhone 15, Sony Headphones, Air Fryer, Myntra...)"
                className="w-full pl-10 pr-10 py-2 bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-full text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Saved Deals Watchlist */}
            <button
              onClick={() => navigate('/watchlist')}
              id="saved-watchlist-btn"
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-full transition-colors shrink-0 cursor-pointer"
              title="View Watchlist"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${savedDealsCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
              {savedDealsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white font-bold text-[9px] sm:text-[10px] rounded-full flex items-center justify-center border-2 border-white">
                  {savedDealsCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Dedicated Full-Width Search Bar */}
        <div className="block sm:hidden w-full pt-0.5">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              id="search-deals-input-mobile"
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search deals (e.g., iPhone, Sony, Myntra...)"
              className="w-full pl-9 pr-8 py-1.5 bg-slate-100 focus:bg-white border border-slate-200 focus:border-orange-500 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
