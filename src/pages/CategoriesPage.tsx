import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Deal } from '../types';
import { DealCard } from '../components/DealCard';
import { Tag, Sparkles, LayoutGrid } from 'lucide-react';

interface CategoriesPageProps {
  deals: Deal[];
  isLoading: boolean;
  savedDealIds: string[];
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

const CATEGORIES_LIST = [
  { name: 'Electronics & Laptops', icon: '💻', color: 'from-blue-500 to-indigo-600', desc: 'Laptops, TVs, Audio, Gaming & Accessories' },
  { name: 'Mobiles & Tablets', icon: '📱', color: 'from-purple-500 to-pink-600', desc: 'Smartphones, Tablets, Smartwatches & Cases' },
  { name: 'Fashion & Apparel', icon: '👕', color: 'from-orange-500 to-red-600', desc: 'Clothing, Shoes, Watches, Eyewear & Bags' },
  { name: 'Home & Kitchen', icon: '🏠', color: 'from-emerald-500 to-teal-600', desc: 'Air Fryers, Vacuum Cleaners, Cookware & Furniture' },
  { name: 'Beauty & Personal Care', icon: '✨', color: 'from-rose-500 to-pink-600', desc: 'Skincare, Haircare, Perfumes & Grooming Kits' },
  { name: 'Grocery & Essentials', icon: '🛒', color: 'from-amber-500 to-yellow-600', desc: 'Daily Staples, Snacks, Beverages & Cleaning' },
  { name: 'Travel & Flights', icon: '✈️', color: 'from-sky-500 to-blue-600', desc: 'Luggage, Flight Discounts, Hotel Vouchers & Bus Bookings' },
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  deals,
  isLoading,
  savedDealIds,
  onVote,
  onToggleSave,
  onOpenPriceAlert,
}) => {
  const { categoryName } = useParams<{ categoryName?: string }>();
  const navigate = useNavigate();

  const selectedCat = categoryName ? decodeURIComponent(categoryName) : null;

  const categoryDeals = selectedCat
    ? deals.filter(d => d.category.toLowerCase() === selectedCat.toLowerCase())
    : deals;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>E-Commerce Categories</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            {selectedCat ? selectedCat : 'Explore Categories'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {selectedCat ? `Showing ${categoryDeals.length} live deals in ${selectedCat}` : 'Browse curated discount offers across all product categories'}
          </p>
        </div>

        {selectedCat && (
          <button
            onClick={() => navigate('/categories')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            View All Categories
          </button>
        )}
      </div>

      {/* Category Pills/Cards selection grid */}
      {!selectedCat && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {CATEGORIES_LIST.map((cat) => {
            const count = deals.filter(d => d.category === cat.name).length;
            return (
              <div
                key={cat.name}
                onClick={() => navigate(`/category/${encodeURIComponent(cat.name)}`)}
                className="bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 group space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{cat.icon}</span>
                  <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 font-extrabold text-[11px] rounded-full">
                    {count} deals
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{cat.desc}</p>
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
      ) : categoryDeals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categoryDeals.map((deal) => (
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
          <div className="text-4xl">📦</div>
          <h3 className="font-bold text-slate-900 text-lg">No Deals in this Category</h3>
          <p className="text-xs text-slate-500">
            Be the first to post a bargain in this category!
          </p>
          <button
            onClick={() => navigate('/categories')}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
          >
            All Categories
          </button>
        </div>
      )}

    </div>
  );
};
