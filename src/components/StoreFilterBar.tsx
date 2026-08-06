import React from 'react';
import { StoreName } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { Store, Tag } from 'lucide-react';

interface StoreFilterBarProps {
  selectedStore: StoreName | 'All';
  onSelectStore: (store: StoreName | 'All') => void;
  dealsCountByStore: Record<string, number>;
}

export const StoreFilterBar: React.FC<StoreFilterBarProps> = ({
  selectedStore,
  onSelectStore,
  dealsCountByStore,
}) => {
  const stores = Object.keys(STORES_INFO) as StoreName[];

  return (
    <div id="store-filter-bar" className="bg-slate-50/80 border-b border-slate-200 py-3">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <Store className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter by E-Commerce Platform</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
          {/* All Stores option */}
          <button
            onClick={() => onSelectStore('All')}
            id="filter-store-all"
            className={`px-3.5 py-1.5 rounded-full font-semibold text-xs border transition-all shrink-0 flex items-center gap-1.5 ${
              selectedStore === 'All'
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
            }`}
          >
            <Tag className="w-3 h-3" />
            <span>All Stores</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${selectedStore === 'All' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {(Object.values(dealsCountByStore) as number[]).reduce((a, b) => a + b, 0)}
            </span>
          </button>

          {/* Individual Stores */}
          {stores.map((store) => {
            const isSelected = selectedStore === store;
            const count = dealsCountByStore[store] || 0;
            const info = STORES_INFO[store];

            return (
              <button
                key={store}
                id={`filter-store-${store.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectStore(store)}
                className={`px-3 py-1.5 rounded-full font-semibold text-xs border transition-all shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? `${info.badgeBg} font-bold shadow-xs border-current ring-2 ring-orange-500/30`
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.accentColor }} />
                <span>{store}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
