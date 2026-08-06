import React from 'react';
import { Search, Flame, Plus, Heart, Sparkles, X, SlidersHorizontal, ArrowUpDown, ShieldAlert } from 'lucide-react';
import { FilterOptions } from '../types';

interface HeaderProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  savedDealsCount: number;
  onOpenSavedDeals: () => void;
  onOpenPostDeal: () => void;
  onOpenAiInspector: () => void;
  onOpenAdmin?: () => void;
  totalDealsCount: number;
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  filters,
  setFilters,
  savedDealsCount,
  onOpenSavedDeals,
  onOpenPostDeal,
  onOpenAiInspector,
  onOpenAdmin,
  totalDealsCount,
  onLogoClick,
}) => {
  return (
    <header id="main-header-navbar" className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-3 md:gap-6">
          
          {/* Logo */}
          <div 
            onClick={onLogoClick} 
            className="flex items-center gap-3 shrink-0 cursor-pointer group"
          >
            <a href="#" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
                <Flame className="w-6 h-6 fill-amber-200 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  Monday <span className="text-orange-600">Bazaar</span>
                </span>
                <span className="text-[10px] font-medium text-slate-500 tracking-wide uppercase mt-0.5">
                  Amazon • Flipkart • Multi-Store
                </span>
              </div>
            </a>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl relative">
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
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Admin Panel Button */}
            {onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                id="admin-panel-header-btn"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 rounded-full font-bold text-xs transition-all shadow-2xs"
                title="Manage Deals & Affiliation Rules"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden md:inline">Admin</span>
              </button>
            )}

            {/* AI Link Inspector */}
            <button
              onClick={onOpenAiInspector}
              id="ai-inspector-header-btn"
              className="hidden lg:inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 text-indigo-700 border border-indigo-200/80 rounded-full font-semibold text-xs transition-all shadow-xs"
              title="Paste any product URL to inspect with Gemini AI"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin-slow" />
              <span>AI Link Inspector</span>
            </button>

            {/* Post Deal */}
            <button
              onClick={onOpenPostDeal}
              id="post-deal-header-btn"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold text-xs transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 text-orange-400" />
              <span className="hidden sm:inline">Post Deal</span>
            </button>

            {/* Saved Deals Watchlist */}
            <button
              onClick={onOpenSavedDeals}
              id="saved-watchlist-btn"
              className="relative p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 rounded-full transition-colors"
              title="View Watchlist"
            >
              <Heart className={`w-5 h-5 ${savedDealsCount > 0 ? 'text-red-500 fill-red-500' : ''}`} />
              {savedDealsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white font-bold text-[10px] rounded-full flex items-center justify-center border-2 border-white">
                  {savedDealsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
