import React from 'react';
import { Deal } from '../types';
import { DealCard } from '../components/DealCard';
import { Heart, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WatchlistPageProps {
  deals: Deal[];
  savedDealIds: string[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
  onClearWatchlist: () => void;
}

export const WatchlistPage: React.FC<WatchlistPageProps> = ({
  deals,
  savedDealIds,
  onVote,
  onToggleSave,
  onOpenPriceAlert,
  onClearWatchlist,
}) => {
  const navigate = useNavigate();

  const savedDeals = deals.filter(d => savedDealIds.includes(d.id));

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
            <Heart className="w-4 h-4 fill-red-500 text-red-500" />
            <span>Personal Watchlist</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            My Saved Deals ({savedDeals.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Your saved bargains, price drops, and coupon codes stored for quick access
          </p>
        </div>

        {savedDeals.length > 0 && (
          <button
            onClick={onClearWatchlist}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Watchlist
          </button>
        )}
      </div>

      {/* Saved Deals Grid */}
      {savedDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {savedDeals.map((deal) => (
            <DealCard
              key={deal.id}
              deal={deal}
              onSelectDeal={(d) => navigate(`/deal/${d.id}`)}
              onVote={onVote}
              isSaved={true}
              onToggleSave={onToggleSave}
              onOpenPriceAlert={onOpenPriceAlert}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">Your Watchlist is Empty</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Heart any deal card across Amazon, Flipkart, or Myntra to save it here for tracking!
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors"
          >
            Explore Hot Deals
          </button>
        </div>
      )}

    </div>
  );
};
