import React, { useState } from 'react';
import { Deal } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { PriceHistoryChart } from './PriceHistoryChart';
import { shareDeal } from '../utils/shareUtils';
import { 
  ArrowLeft, 
  ExternalLink, 
  Check, 
  Copy, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Ticket, 
  ShieldCheck, 
  Flame, 
  MessageSquare, 
  Send, 
  Clock, 
  Bell, 
  Share2,
  CheckCircle2,
  XCircle,
  Heart,
  Store,
  Tag
} from 'lucide-react';
import { DealCard } from './DealCard';

interface DealDetailPageProps {
  deal: Deal;
  onBack: () => void;
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onAddComment: (dealId: string, text: string) => void;
  onOpenPriceAlert: (deal: Deal) => void;
  isSaved: boolean;
  onToggleSave: (deal: Deal) => void;
  allDeals: Deal[];
  onSelectDeal: (deal: Deal) => void;
}

export const DealDetailPage: React.FC<DealDetailPageProps> = ({
  deal,
  onBack,
  onVote,
  onAddComment,
  onOpenPriceAlert,
  isSaved,
  onToggleSave,
  allDeals,
  onSelectDeal,
}) => {
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [commentText, setCommentText] = useState('');

  const storeInfo = STORES_INFO[deal.store] || {
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#334155',
  };

  const handleCopyCoupon = () => {
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const handleShare = async () => {
    const success = await shareDeal(deal);
    if (!success) {
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(deal.id, commentText);
    setCommentText('');
  };

  const savingsAmount = deal.originalPrice - deal.dealPrice;

  // Filter 4 related deals from same category or store (excluding current deal)
  const relatedDeals = allDeals
    .filter(d => d.id !== deal.id && (d.category === deal.category || d.store === deal.store))
    .slice(0, 4);

  return (
    <div id="deal-detail-page" className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-8 animate-in fade-in duration-300 overflow-hidden">
      
      {/* Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <button
          onClick={onBack}
          id="back-to-deals-btn"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 shadow-xs transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4 text-orange-600" />
          <span>← Back to All Deals</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onToggleSave(deal)}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
              isSaved
                ? 'bg-red-500 text-white border-red-600 shadow-xs'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-white' : 'text-red-500'}`} />
            <span>{isSaved ? 'Saved' : 'Save'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-colors"
          >
            {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
            <span>{copiedShare ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={() => onOpenPriceAlert(deal)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Bell className="w-4 h-4 text-amber-600" />
            <span>Price Drop Alert</span>
          </button>
        </div>
      </div>

      {/* Main Deal Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Product Image Gallery */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="relative bg-white rounded-3xl p-4 border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center">
            <img
              src={deal.imageUrl}
              alt={deal.title}
              className="w-full h-80 sm:h-96 object-cover rounded-2xl"
            />
            
            {/* Badges Overlay */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
              <span className={`px-3 py-1 rounded-xl text-xs font-bold border shadow-md backdrop-blur-md ${storeInfo.badgeBg}`}>
                {deal.store}
              </span>

              {deal.isLootDeal && (
                <span className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-xs shadow-lg flex items-center gap-1.5 animate-pulse">
                  <Flame className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  LOOT DEAL
                </span>
              )}
            </div>
          </div>

          {/* Quick Specs / Trust Signals */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">100% Verified</p>
                <p className="text-[10px] text-slate-500">Live store link confirmed</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <p className="font-bold text-slate-900">{deal.postedAt}</p>
                <p className="text-[10px] text-slate-500">Posted by {deal.postedBy}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Product Info & AI Analysis */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Breadcrumb / Category */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
              {deal.category}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-500 font-medium">{deal.store} Offer</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {deal.title}
          </h1>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-200">
            {deal.description}
          </p>

          {/* Price & Savings Highlight Card */}
          <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white rounded-3xl border border-slate-800 shadow-md space-y-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-amber-400">
                ₹{deal.dealPrice.toLocaleString('en-IN')}
              </span>
              <span className="text-base text-slate-400 line-through font-semibold">
                ₹{deal.originalPrice.toLocaleString('en-IN')}
              </span>
              <span className="px-3 py-1 rounded-xl bg-red-600 text-white font-black text-xs shadow-sm">
                -{deal.discountPercentage}% OFF
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800 text-slate-300">
              <span>Instant Savings: <strong className="text-emerald-400 font-extrabold text-sm">₹{savingsAmount.toLocaleString('en-IN')}</strong></span>
              {deal.expiryDate && <span className="text-amber-300 font-medium">⏳ {deal.expiryDate}</span>}
            </div>
          </div>

          {/* Coupon Code Block */}
          {deal.couponCode && (
            <div className="bg-amber-100/80 border border-amber-300 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Applicable Coupon Code</p>
                  <p className="font-mono font-bold text-base text-slate-900 tracking-wider">{deal.couponCode}</p>
                </div>
              </div>

              <button
                onClick={handleCopyCoupon}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  copiedCoupon ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                }`}
              >
                {copiedCoupon ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedCoupon ? 'Code Copied!' : 'Copy Code'}</span>
              </button>
            </div>
          )}

          {/* Primary CTA Buy Button */}
          <a
            href={deal.dealUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-4 px-6 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg transition-all transform hover:scale-[1.01]"
          >
            <span>GO TO {deal.store.toUpperCase()} TO BUY THIS DEAL</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          {/* Gemini AI Deal Inspector Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-extrabold text-base text-slate-900">Gemini AI Deal Inspection</h3>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-black text-xs rounded-xl">
                Score: {deal.aiScore}/100
              </span>
            </div>

            <p className="text-xs text-slate-700 font-medium leading-relaxed bg-indigo-50/60 p-3.5 rounded-xl border border-indigo-100">
              {deal.aiVerdict}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
                <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pros & Deal Highlights
                </h4>
                <ul className="space-y-1.5">
                  {deal.aiPros.map((pro, i) => (
                    <li key={i} className="text-xs text-emerald-900/90 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-rose-50 rounded-2xl border border-rose-200 space-y-2">
                <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Things to Watch Out For
                </h4>
                <ul className="space-y-1.5">
                  {deal.aiCons.map((con, i) => (
                    <li key={i} className="text-xs text-rose-900/90 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 30-Day Price Tracker */}
          <PriceHistoryChart
            priceHistory={deal.priceHistory}
            currentPrice={deal.dealPrice}
            originalPrice={deal.originalPrice}
          />

          {/* Community Discussion & Comments */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-slate-700" />
                <h3 className="font-extrabold text-base text-slate-900">Community Discussion</h3>
              </div>
              <span className="text-xs font-bold text-slate-500">{deal.commentsCount} Comments</span>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share coupon code details, bank offer tips, or questions..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>

            {/* Comments List */}
            <div className="space-y-3">
              {deal.comments && deal.comments.length > 0 ? (
                deal.comments.map((comment) => (
                  <div key={comment.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600">{comment.text}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 text-center py-6">No comments on this deal yet. Be the first to start the discussion!</p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Related / Similar Deals Section */}
      {relatedDeals.length > 0 && (
        <div className="pt-8 border-t border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-slate-900">Similar Deals You Might Like</h3>
            <button onClick={onBack} className="text-xs font-bold text-orange-600 hover:underline">
              View All Deals →
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {relatedDeals.map((rDeal) => (
              <DealCard
                key={rDeal.id}
                deal={rDeal}
                onSelectDeal={onSelectDeal}
                onVote={onVote}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
                onOpenPriceAlert={onOpenPriceAlert}
              />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
