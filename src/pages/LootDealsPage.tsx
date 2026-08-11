import React from 'react';
import { Deal } from '../types';
import { DealCard } from '../components/DealCard';
import { Flame, Sparkles, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LootDealsPageProps {
  deals: Deal[];
  isLoading: boolean;
  savedDealIds: string[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

export const LootDealsPage: React.FC<LootDealsPageProps> = ({
  deals,
  isLoading,
  savedDealIds,
  onVote,
  onToggleSave,
  onOpenPriceAlert,
}) => {
  const navigate = useNavigate();

  const lootDeals = deals.filter(d => d.isLootDeal || d.discountPercentage >= 65);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Loot Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-amber-600 rounded-3xl p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-wider text-amber-200">
            <Flame className="w-4 h-4 fill-amber-300 text-amber-300 animate-bounce" />
            Extreme Price Drops & Price Errors
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
            Loot Deals & Flash Price Drops
          </h1>
          <p className="text-xs sm:text-sm text-amber-100 font-medium leading-relaxed">
            Unbeatable discount glitches, clearance liquidations, and price crashes across Amazon, Flipkart, Myntra & top Indian stores. Claim before stock runs out!
          </p>
        </div>
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Loot Deals Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
              <div className="w-full h-44 bg-slate-100 rounded-2xl"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : lootDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {lootDeals.map((deal) => (
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
      ) : (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 max-w-md mx-auto my-8 space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-900 text-lg">No Active Loot Deals</h3>
          <p className="text-xs text-slate-500">
            All loot deals have been claimed for today. Check back soon or explore general deals catalog.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            Browse All Deals
          </button>
        </div>
      )}

    </div>
  );
};
