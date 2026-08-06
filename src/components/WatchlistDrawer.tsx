import React from 'react';
import { Deal } from '../types';
import { X, Heart, ExternalLink, Trash2, ShoppingBag } from 'lucide-react';

interface WatchlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedDeals: Deal[];
  onSelectDeal: (deal: Deal) => void;
  onRemoveSave: (dealId: string) => void;
}

export const WatchlistDrawer: React.FC<WatchlistDrawerProps> = ({
  isOpen,
  onClose,
  savedDeals,
  onSelectDeal,
  onRemoveSave,
}) => {
  if (!isOpen) return null;

  return (
    <div id="watchlist-drawer-overlay" className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div 
        id="watchlist-drawer-content"
        className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            <h3 className="font-bold text-base text-slate-900">Saved Deals Watchlist</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold text-xs rounded-full">
              {savedDeals.length}
            </span>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedDeals.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <p className="font-bold text-slate-700 text-sm">Your watchlist is empty</p>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Click the heart icon on any deal card to save it for quick access later!
              </p>
            </div>
          ) : (
            savedDeals.map((deal) => (
              <div
                key={deal.id}
                onClick={() => {
                  onSelectDeal(deal);
                  onClose();
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition-colors flex gap-3 cursor-pointer group"
              >
                <img
                  src={deal.imageUrl}
                  alt={deal.title}
                  className="w-16 h-16 object-cover rounded-xl shrink-0"
                />

                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] font-bold text-orange-600 bg-orange-100/80 px-1.5 py-0.2 rounded">
                    {deal.store}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900 line-clamp-1 group-hover:text-orange-600">
                    {deal.title}
                  </h4>
                  <div className="flex items-baseline gap-2">
                    <span className="font-black text-sm text-slate-900">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-slate-400 line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSave(deal.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-600 self-start hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};
