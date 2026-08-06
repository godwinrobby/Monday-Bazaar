import React, { useState } from 'react';
import { AIAnalysisResponse, Deal } from '../types';
import { 
  X, 
  Sparkles, 
  Link, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  TrendingDown, 
  ShieldCheck, 
  Plus, 
  Loader2,
  Flame,
  Award
} from 'lucide-react';

interface AiLinkAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostAnalyzedDeal: (deal: Partial<Deal>) => void;
}

export const AiLinkAnalyzerModal: React.FC<AiLinkAnalyzerModalProps> = ({
  isOpen,
  onClose,
  onPostAnalyzedDeal,
}) => {
  if (!isOpen) return null;

  const [inputUrl, setInputUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse['data'] | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setLoading(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlOrText: inputUrl }),
      });

      const json: AIAnalysisResponse = await response.json();

      if (json.success && json.data) {
        setAnalysisResult(json.data);
      } else {
        setError(json.error || 'Failed to inspect link with AI.');
      }
    } catch (err: any) {
      setError('Server communication error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePostToFeed = () => {
    if (!analysisResult) return;

    onPostAnalyzedDeal({
      title: analysisResult.title,
      store: analysisResult.store,
      category: analysisResult.category,
      originalPrice: analysisResult.originalPrice,
      dealPrice: analysisResult.dealPrice,
      discountPercentage: analysisResult.discountPercentage,
      couponCode: analysisResult.couponCode,
      dealUrl: inputUrl.startsWith('http') ? inputUrl : 'https://www.amazon.in',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      description: analysisResult.aiVerdict,
      isLootDeal: analysisResult.isLootDeal,
      aiScore: analysisResult.aiScore,
      aiVerdict: analysisResult.aiVerdict,
      aiPros: analysisResult.aiPros,
      aiCons: analysisResult.aiCons,
    });

    onClose();
  };

  return (
    <div id="ai-analyzer-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        id="ai-analyzer-modal-content"
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-400/30">
              <Sparkles className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gemini AI Link Inspector</h3>
              <p className="text-xs text-indigo-200">Paste any Amazon, Flipkart, Myntra or e-commerce URL to analyze price drop</p>
            </div>
          </div>

          <button
            onClick={onClose}
            id="close-ai-analyzer-modal"
            className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[80vh]">
          
          {/* Input Form */}
          <form onSubmit={handleAnalyze} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Paste Product Link or Deal Text
            </label>
            <div className="relative">
              <Link className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <textarea
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                rows={2}
                placeholder="e.g. https://www.amazon.in/dp/B0CX... or Flipkart Samsung S24 256GB at 64999 with card discount"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !inputUrl.trim()}
              id="submit-ai-analyze-btn"
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  <span>Inspecting Link with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Inspect Price & Calculate Deal Score</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-700 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Card */}
          {analysisResult && (
            <div className="space-y-4 pt-3 border-t border-slate-200 animate-in fade-in duration-300">
              
              {/* Top Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-amber-500 text-slate-950 font-black text-xs rounded-lg flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" />
                    AI Deal Score: {analysisResult.aiScore}/100
                  </span>
                  
                  {analysisResult.isLootDeal && (
                    <span className="px-2.5 py-1 bg-red-600 text-white font-extrabold text-xs rounded-lg flex items-center gap-1 animate-pulse">
                      <Flame className="w-3.5 h-3.5 fill-yellow-300 text-yellow-300" />
                      LOOT DEAL
                    </span>
                  )}
                </div>

                <h4 className="font-bold text-sm sm:text-base text-slate-100 leading-snug">
                  {analysisResult.title}
                </h4>

                {/* Price Breakdown */}
                <div className="flex items-baseline gap-3 pt-1 border-t border-slate-800">
                  <span className="text-2xl font-black text-amber-400">
                    ₹{analysisResult.dealPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs text-slate-400 line-through">
                    ₹{analysisResult.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded">
                    -{analysisResult.discountPercentage}% OFF
                  </span>
                </div>
              </div>

              {/* Verdict Summary */}
              <div className="p-3.5 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs text-indigo-950 space-y-1">
                <span className="font-bold uppercase text-[10px] tracking-wider text-indigo-700 block">AI Verdict</span>
                <p className="leading-relaxed">{analysisResult.aiVerdict}</p>
              </div>

              {/* Recommendation */}
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="font-bold text-emerald-900">Buying Recommendation:</span>
                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-lg uppercase">
                  {analysisResult.buyRecommendation.replace('_', ' ')}
                </span>
              </div>

              {/* Action: Post to Feed */}
              <button
                onClick={handlePostToFeed}
                className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Post This Deal To Dealsified Feed</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
