import React, { useState } from 'react';
import { CategoryName, Deal, StoreName } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { X, Plus, Sparkles, Image, Ticket, DollarSign, Tag, Store, AlertTriangle } from 'lucide-react';

interface PostDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDeal: (deal: Partial<Deal>) => Promise<{ success: boolean; error?: string }> | void;
}

const STORES = Object.keys(STORES_INFO) as StoreName[];
const CATEGORIES: CategoryName[] = [
  'Mobiles & Tablets',
  'Electronics & Laptops',
  'Audio & Headphones',
  'Smartwatches',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Gaming & Accessories',
  'Beauty & Grooming'
];

export const PostDealModal: React.FC<PostDealModalProps> = ({
  isOpen,
  onClose,
  onAddDeal,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [store, setStore] = useState<StoreName>('Amazon');
  const [category, setCategory] = useState<CategoryName>('Electronics & Laptops');
  const [originalPrice, setOriginalPrice] = useState('');
  const [dealPrice, setDealPrice] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [dealUrl, setDealUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!title || !dealPrice || !dealUrl) return;

    const orig = parseFloat(originalPrice) || parseFloat(dealPrice);
    const dealP = parseFloat(dealPrice);
    const discountPct = Math.round(((orig - dealP) / orig) * 100) || 0;

    setIsSubmitting(true);
    try {
      const res = await onAddDeal({
        title,
        store,
        category,
        originalPrice: orig,
        dealPrice: dealP,
        discountPercentage: discountPct,
        couponCode: couponCode.trim() || undefined,
        dealUrl,
        imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
        description: description.trim() || 'Verified bargain deal found by Monday Bazaar user community.',
        isLootDeal: discountPct >= 40,
        isVerified: true,
        postedAt: 'Just now',
        createdAt: new Date().toISOString(),
      });

      if (res && !res.success) {
        setErrorMsg(res.error || 'Failed to post deal. A deal with this title or link already exists.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating deal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="post-deal-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="post-deal-modal-content"
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Post a Deal</h3>
              <p className="text-xs text-slate-500">Share a price drop or loot deal with the community</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[80vh] text-xs">
          
          {errorMsg && (
            <div className="p-3.5 bg-red-50 border border-red-300 rounded-2xl text-red-700 text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          
          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apple AirPods Pro (2nd Gen) with MagSafe Case"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">E-Commerce Store</label>
              <select
                value={store}
                onChange={(e) => setStore(e.target.value as StoreName)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {STORES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryName)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Deal Price (₹) *</label>
              <input
                type="number"
                required
                value={dealPrice}
                onChange={(e) => setDealPrice(e.target.value)}
                placeholder="e.g. 18999"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Original MRP (₹)</label>
              <input
                type="number"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="e.g. 24900"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Coupon Code</label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="e.g. SAVE2000"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 font-mono uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Deal Link URL *</label>
            <input
              type="url"
              required
              value={dealUrl}
              onChange={(e) => setDealUrl(e.target.value)}
              placeholder="https://www.amazon.in/dp/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Product Image URL (Optional)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description / Offer Details</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add bank card offers, cashback terms or extra info..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-sm transition-colors"
          >
            Submit Deal to Community
          </button>

        </form>

      </div>
    </div>
  );
};
