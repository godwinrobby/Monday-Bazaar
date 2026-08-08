import React, { useState } from 'react';
import { Deal } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { recordLinkClick, recordDealView } from '../utils/analytics';
import { 
  Flame, 
  ExternalLink, 
  Check, 
  Copy, 
  TrendingDown, 
  Sparkles, 
  ThumbsUp, 
  ThumbsDown, 
  Heart, 
  LineChart, 
  Bell, 
  Share2, 
  Clock, 
  MessageSquare,
  ShieldCheck,
  Ticket
} from 'lucide-react';

interface DealCardProps {
  deal: Deal;
  onSelectDeal: (deal: Deal) => void;
  onVote: (dealId: string, type: 'up' | 'down') => void;
  isSaved: boolean;
  onToggleSave: (deal: Deal) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

export const DealCard: React.FC<DealCardProps> = ({
  deal,
  onSelectDeal,
  onVote,
  isSaved,
  onToggleSave,
  onOpenPriceAlert,
}) => {
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const storeInfo = STORES_INFO[deal.store] || {
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#334155',
  };

  const handleCopyCoupon = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopiedCoupon(true);
      setTimeout(() => setCopiedCoupon(false), 2000);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = window.location.origin + (window.location.pathname !== '/' ? window.location.pathname : '') + '?deal=' + deal.id;
    const shareData = {
      title: `Deal: ${deal.title}`,
      text: `🔥 Check out this deal: ${deal.title} for ₹${deal.dealPrice.toLocaleString('en-IN')} (${deal.discountPercentage}% OFF) on ${deal.store}!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          try {
            await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
            setCopiedShare(true);
            setTimeout(() => setCopiedShare(false), 2000);
          } catch (clipErr) {
            console.error('Clipboard copy failed:', clipErr);
          }
        }
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      } catch (clipErr) {
        console.error('Clipboard copy failed:', clipErr);
      }
    }
  };

  const savingsAmount = deal.originalPrice - deal.dealPrice;

  // AI Score badge color logic
  const getAiScoreBadgeClass = (score: number) => {
    if (score >= 90) return 'bg-emerald-500 text-white';
    if (score >= 75) return 'bg-amber-500 text-white';
    return 'bg-slate-700 text-white';
  };

  return (
    <div
      id={`deal-card-${deal.id}`}
      onClick={() => {
        recordDealView(deal.id);
        onSelectDeal(deal);
      }}
      className="group relative bg-white rounded-2xl border border-slate-200 hover:border-orange-300 shadow-2xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      <div>
        {/* Top Image & Badges Overlay */}
        <div className="relative aspect-16/10 w-full overflow-hidden bg-slate-50">
          <img
            src={deal.imageUrl}
            alt={deal.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/20" />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            {/* Store Name Badge */}
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border shadow-xs backdrop-blur-md ${storeInfo.badgeBg}`}>
              {deal.store}
            </span>

            {/* Watchlist & Share Buttons */}
            <div className="flex items-center gap-1.5">
              <a
                href={deal.dealUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                  recordLinkClick(deal);
                }}
                className="p-1.5 rounded-full bg-orange-600 hover:bg-orange-700 text-white backdrop-blur-md transition-colors"
                title="Open Deal directly in new tab"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSave(deal);
                }}
                className={`p-1.5 rounded-full backdrop-blur-md transition-colors ${
                  isSaved ? 'bg-red-500 text-white' : 'bg-black/40 hover:bg-black/60 text-white'
                }`}
                title={isSaved ? "Remove from Watchlist" : "Save to Watchlist"}
              >
                <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-colors relative"
                title="Share Deal"
              >
                {copiedShare ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Bottom Overlay Badges inside Image */}
          <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
            {deal.isLootDeal ? (
              <span className="px-2.5 py-0.5 rounded-md bg-gradient-to-r from-red-600 to-orange-600 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 animate-pulse">
                <Flame className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                LOOT DEAL
              </span>
            ) : deal.isVerified ? (
              <span className="px-2 py-0.5 rounded-md bg-emerald-600/90 text-white font-semibold text-[10px] flex items-center gap-1 backdrop-blur-xs">
                <ShieldCheck className="w-3 h-3" />
                Verified Deal
              </span>
            ) : <div />}

            {/* Discount Pill */}
            <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white font-black text-xs shadow-sm flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              -{deal.discountPercentage}% OFF
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          
          {/* Category & Posted Time */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
              {deal.category}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="w-3 h-3" />
              {deal.postedAt}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-2 leading-snug group-hover:text-orange-600 transition-colors">
            {deal.title}
          </h3>

          {/* Price Block */}
          <div className="flex items-baseline gap-2 pt-1">
            <span className="text-xl font-black text-slate-900">
              ₹{deal.dealPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-400 line-through font-medium">
              ₹{deal.originalPrice.toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Save ₹{savingsAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Coupon Code Section (if present) */}
          {deal.couponCode && (
            <div 
              onClick={handleCopyCoupon}
              className="flex items-center justify-between bg-amber-50/80 border border-dashed border-amber-300 hover:border-amber-400 rounded-xl p-2 transition-all cursor-pointer group/coupon"
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4 text-amber-600" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Coupon Code</span>
                  <span className="font-mono font-bold text-xs text-amber-950 tracking-wider">{deal.couponCode}</span>
                </div>
              </div>
              <button
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  copiedCoupon
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-600 group-hover/coupon:bg-amber-700 text-white'
                }`}
              >
                {copiedCoupon ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Score & Verdict Preview */}
          <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex items-start gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black shrink-0 ${getAiScoreBadgeClass(deal.aiScore)}`}>
              AI {deal.aiScore}/100
            </span>
            <p className="text-slate-600 text-[11px] line-clamp-2 leading-relaxed">
              <Sparkles className="w-3 h-3 text-indigo-500 inline mr-1" />
              {deal.aiVerdict}
            </p>
          </div>

        </div>
      </div>

      {/* Footer / Interactive Actions */}
      <div className="p-4 pt-0 space-y-3">
        
        {/* Voting & Community Stats */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          
          {/* Vote Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onVote(deal.id, 'up');
              }}
              className={`p-1 rounded-lg flex items-center gap-1 font-bold transition-colors ${
                deal.userVoted === 'up'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'hover:bg-slate-200 text-slate-600'
              }`}
              title="Upvote Deal"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{deal.upvotes}</span>
            </button>

            <span className="text-slate-300">|</span>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onVote(deal.id, 'down');
              }}
              className={`p-1 rounded-lg flex items-center gap-1 text-slate-500 transition-colors ${
                deal.userVoted === 'down'
                  ? 'bg-slate-700 text-white'
                  : 'hover:bg-slate-200'
              }`}
              title="Downvote"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenPriceAlert(deal);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg hover:text-orange-600 transition-colors"
              title="Set Price Drop Alert"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelectDeal(deal);
              }}
              className="flex items-center gap-1 p-1.5 hover:bg-slate-100 rounded-lg hover:text-orange-600 transition-colors"
              title="View Comments"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{deal.commentsCount}</span>
            </button>
          </div>

        </div>

        {/* Primary CTA Button */}
        <a
          href={deal.dealUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.stopPropagation();
            recordLinkClick(deal);
          }}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all group-hover:shadow-md"
        >
          <span>GET DEAL ON {deal.store.toUpperCase()}</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

      </div>
    </div>
  );
};
