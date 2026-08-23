import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Deal } from '../types';
import { DealCard } from '../components/DealCard';
import { STORES_INFO } from '../data/initialDeals';
import { Store, LayoutGrid, ExternalLink } from 'lucide-react';

interface StoresPageProps {
  deals: Deal[];
  isLoading: boolean;
  savedDealIds: string[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  deals,
  isLoading,
  savedDealIds,
  onVote,
  onToggleSave,
  onOpenPriceAlert,
}) => {
  const { storeName } = useParams<{ storeName?: string }>();
  const navigate = useNavigate();

  const selectedStore = storeName ? decodeURIComponent(storeName) : null;

  const storeDeals = selectedStore
    ? deals.filter(d => d.store.toLowerCase() === selectedStore.toLowerCase())
    : deals;

  const allStores = Object.keys(STORES_INFO);

  const isStoreClosed = (store: string): boolean => {
    try {
      const saved = localStorage.getItem('storeStatuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[store] === 'closed';
      }
    } catch {}
    return false;
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <Store className="w-4 h-4" />
            <span>Supported Merchants & Stores</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {selectedStore ? `${selectedStore} Deals` : 'Browse E-Commerce Stores'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {selectedStore ? `Showing ${storeDeals.length} active deals for ${selectedStore}` : 'Select your favorite shopping merchant to filter verified price drops'}
          </p>
        </div>

        {selectedStore && (
          <button
            onClick={() => navigate('/stores')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            View All Stores
          </button>
        )}
      </div>

      {/* Stores Selection Grid */}
      {!selectedStore && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {allStores.map((store) => {
            const info = STORES_INFO[store] || { logo: '🛒', badgeBg: 'bg-slate-100 text-slate-800' };
            const count = deals.filter(d => d.store === store).length;
            const closed = isStoreClosed(store);
            return (
              <div
                key={store}
                onClick={() => !closed && navigate(`/store/${encodeURIComponent(store)}`)}
                className={`bg-white hover:bg-orange-50/50 border rounded-2xl p-4 text-center cursor-pointer transition-all space-y-2 ${
                  closed
                    ? 'border-slate-200 opacity-50 cursor-not-allowed line-through'
                    : 'border-slate-200/90 hover:shadow-md hover:border-orange-300 group'
                }`}
              >
                <div className="text-3xl font-black">{closed ? '🔒' : info.logo}</div>
                <div>
                  <h3 className={`font-bold text-sm transition-colors ${closed ? 'text-slate-400' : 'text-slate-900 group-hover:text-orange-600'}`}>
                    {store}
                  </h3>
                  <span className={`inline-block mt-1 px-2 py-0.5 font-extrabold text-[10px] rounded-md ${
                    closed
                      ? 'bg-red-100 text-red-700'
                      : 'bg-slate-100 group-hover:bg-orange-100 group-hover:text-orange-800 text-slate-600'
                  }`}>
                    {closed ? 'TEMPORARILY CLOSED' : `${count} deals`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Deals List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
              <div className="w-full h-44 bg-slate-100 rounded-2xl"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : storeDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {storeDeals.map((deal) => (
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
          <div className="text-4xl">🏪</div>
          <h3 className="font-bold text-slate-900 text-lg">No Deals for this Store</h3>
          <p className="text-xs text-slate-500">
            Check back soon as new deals are synced regularly into the database.
          </p>
          <button
            onClick={() => navigate('/stores')}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            All Stores
          </button>
        </div>
      )}

    </div>
  );
};
