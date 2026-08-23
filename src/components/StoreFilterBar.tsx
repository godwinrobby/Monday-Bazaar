import React, { useRef, useState, useEffect } from 'react';
import { StoreName } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { Store, Tag, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  const isStoreClosed = (store: StoreName): boolean => {
    try {
      const saved = localStorage.getItem('storeStatuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed[store] === 'closed';
      }
    } catch {}
    return false;
  };
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
    const amount = direction === 'left' ? -220 : 220;
    scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    setTimeout(checkScroll, 300);
  };

  return (
    <div id="store-filter-bar" className="bg-slate-50/80 border-b border-slate-200/90 py-2.5 sm:py-3 relative w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Header Label */}
        <div className="flex items-center gap-1.5 mb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          <Store className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>FILTER BY E-COMMERCE PLATFORM</span>
        </div>

        <div className="relative">
          {/* Scroll Left Button */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Swipeable Store Row */}
          <div
            ref={scrollRef}
            onScroll={checkScroll}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            className="flex items-center gap-2 overflow-x-auto py-1 no-scrollbar scroll-smooth select-none cursor-grab active:cursor-grabbing pr-8 sm:pr-0"
          >
            {/* All Stores option */}
            <button
              onClick={() => onSelectStore('All')}
              id="filter-store-all"
              className={`px-3.5 py-1.5 rounded-full font-extrabold text-xs border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                selectedStore === 'All'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/50'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>All Stores</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                selectedStore === 'All' ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {(Object.values(dealsCountByStore) as number[]).reduce((a, b) => a + b, 0)}
              </span>
            </button>

            {/* Individual Stores */}
            {stores.map((store) => {
              const isSelected = selectedStore === store;
              const count = dealsCountByStore[store] || 0;
              const info = STORES_INFO[store];
              const closed = isStoreClosed(store);

              return (
                <button
                  key={store}
                  id={`filter-store-${store.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => !closed && onSelectStore(store)}
                  disabled={closed}
                  className={`px-3.5 py-1.5 rounded-full font-bold text-xs border transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                    closed
                      ? 'bg-slate-100 text-slate-400 border-slate-200 line-through opacity-60 cursor-not-allowed'
                      : isSelected
                        ? `${info.badgeBg} border-current ring-2 ring-orange-500/30 shadow-xs`
                        : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                >
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${closed ? 'bg-slate-300' : ''}`} style={{ backgroundColor: closed ? '#ccc' : info.accentColor }} />
                  <span>{store}</span>
                  {closed && <span className="text-[10px] font-bold text-red-500">Closed</span>}
                  {!closed && count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-black/10 text-slate-900' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Floating Scroll Right Arrow Button */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/95 shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-white hover:scale-105 transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


