import React, { useState } from 'react';
import { Deal, Comment } from '../types';
import { STORES_INFO } from '../data/initialDeals';
import { PriceHistoryChart } from './PriceHistoryChart';
import { recordLinkClick } from '../utils/analytics';
import { 
  X, 
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
  HelpCircle
} from 'lucide-react';

interface DealModalProps {
  deal: Deal | null;
  onClose: () => void;
  onVote: (dealId: string, type: 'up' | 'down') => void;
  onAddComment: (dealId: string, text: string) => void;
  onOpenPriceAlert: (deal: Deal) => void;
}

export const DealModal: React.FC<DealModalProps> = ({
  deal,
  onClose,
  onVote,
  onAddComment,
  onOpenPriceAlert,
}) => {
  if (!deal) return null;

  const [copied, setCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'priceHistory' | 'comments'>('details');

  const storeInfo = STORES_INFO[deal.store] || {
    badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
    accentColor: '#334155',
  };

  const handleCopyCoupon = () => {
    if (deal.couponCode) {
      navigator.clipboard.writeText(deal.couponCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(deal.id, commentText);
    setCommentText('');
  };

  const savingsAmount = deal.originalPrice - deal.dealPrice;

  return (
    <div id="deal-detail-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div 
        id="deal-detail-modal-content"
        className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Header Bar */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${storeInfo.badgeBg}`}>
              {deal.store}
            </span>
            <span className="text-xs text-slate-500 font-medium">{deal.category}</span>
          </div>

          <button
            onClick={onClose}
            id="close-deal-modal-btn"
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Main Top Section: Image & Summary */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Image Box */}
            <div className="md:col-span-5 relative bg-slate-50 rounded-2xl p-2 border border-slate-200 flex items-center justify-center overflow-hidden">
              <img
                src={deal.imageUrl}
                alt={deal.title}
                className="w-full h-56 md:h-64 object-cover rounded-xl"
              />
              {deal.isLootDeal && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold text-xs flex items-center gap-1 shadow-md animate-pulse">
                  <Flame className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                  LOOT DEAL
                </span>
              )}
            </div>

            {/* Info Box */}
            <div className="md:col-span-7 space-y-4">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                {deal.title}
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {deal.description}
              </p>

              {/* Price & Discount */}
              <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 flex flex-wrap items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  ₹{deal.dealPrice.toLocaleString('en-IN')}
                </span>
                <span className="text-sm text-slate-400 line-through font-semibold">
                  ₹{deal.originalPrice.toLocaleString('en-IN')}
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white font-black text-xs">
                  {deal.discountPercentage}% OFF
                </span>
                <span className="text-xs font-bold text-emerald-700 w-full">
                  Instant Savings: ₹{savingsAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Coupon Code Block */}
              {deal.couponCode && (
                <div className="bg-amber-100/60 border border-amber-300 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-700" />
                    <div>
                      <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Promo Coupon</p>
                      <p className="font-mono font-bold text-sm text-slate-900">{deal.couponCode}</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyCoupon}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                      copied ? 'bg-emerald-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'
                    }`}
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
              )}

              {/* Action CTA Button */}
              <a
                href={deal.dealUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => recordLinkClick(deal)}
                className="w-full py-3 px-6 bg-gradient-to-r from-orange-500 via-amber-600 to-orange-600 hover:from-orange-600 hover:to-amber-700 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all hover:scale-[1.01]"
              >
                <span>OPEN DEAL AT {deal.store.toUpperCase()}</span>
                <ExternalLink className="w-4 h-4" />
              </a>

            </div>

          </div>

          {/* Navigation Tabs (Details / Price History / Community Comments) */}
          <div className="flex items-center gap-2 border-b border-slate-200 pt-2">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-4 py-2 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-500" />
              AI Deal Inspection
            </button>

            <button
              onClick={() => setActiveTab('priceHistory')}
              className={`px-4 py-2 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'priceHistory'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              Price History
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`px-4 py-2 font-bold text-xs border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'comments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Discussion ({deal.commentsCount})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* AI Score & Verdict Banner */}
              <div className="p-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white rounded-2xl border border-indigo-800/50 shadow-md space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs tracking-wide text-indigo-200">Gemini AI Price Inspector Verdict</span>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg shadow-xs">
                    Score: {deal.aiScore}/100
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {deal.aiVerdict}
                </p>
              </div>

              {/* Pros & Cons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <h4 className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Why Buy (Pros)
                  </h4>
                  <ul className="space-y-1">
                    {deal.aiPros.map((pro, i) => (
                      <li key={i} className="text-xs text-emerald-900/80 flex items-start gap-1.5">
                        <span className="text-emerald-500">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 space-y-2">
                  <h4 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    Caveats (Cons)
                  </h4>
                  <ul className="space-y-1">
                    {deal.aiCons.map((con, i) => (
                      <li key={i} className="text-xs text-rose-900/80 flex items-start gap-1.5">
                        <span className="text-rose-500">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'priceHistory' && (
            <PriceHistoryChart
              priceHistory={deal.priceHistory}
              currentPrice={deal.dealPrice}
              originalPrice={deal.originalPrice}
            />
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Post Comment Input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask a question or share coupon details..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>

              {/* Comments List */}
              <div className="space-y-3">
                {deal.comments && deal.comments.length > 0 ? (
                  deal.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">{comment.userName}</span>
                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                      </div>
                      <p className="text-xs text-slate-600">{comment.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">No community comments yet. Be the first to share details!</p>
                )}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
