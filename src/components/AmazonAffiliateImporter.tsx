import React, { useState } from 'react';
import { Deal, CategoryName } from '../types';

const CATEGORY_LIST: CategoryName[] = [
  'Mobiles & Tablets',
  'Electronics & Laptops',
  'Audio & Headphones',
  'Fashion & Apparel',
  'Home & Kitchen',
  'Smartwatches',
  'Gaming & Accessories',
  'Beauty & Grooming',
];
import { 
  fetchAmazonProductDetails, 
  AmazonFetchResult, 
  CURATED_AMAZON_HOT_DEALS,
  extractAmazonAsin
} from '../utils/amazonFetcher';
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  CheckCircle, 
  ExternalLink, 
  Tag, 
  RefreshCw, 
  Zap, 
  Copy, 
  Check, 
  ShieldCheck, 
  Plus, 
  Layers,
  ArrowRight,
  Flame,
  AlertCircle
} from 'lucide-react';

interface AmazonAffiliateImporterProps {
  amazonTag: string;
  onPublishDeal: (deal: Deal) => void;
}

export const AmazonAffiliateImporter: React.FC<AmazonAffiliateImporterProps> = ({
  amazonTag,
  onPublishDeal
}) => {
  const [inputUrl, setInputUrl] = useState('https://www.amazon.in/dp/B0CX58S7S9');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedResult, setFetchedResult] = useState<AmazonFetchResult | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Mobiles & Tablets');
  const [editablePrice, setEditablePrice] = useState<number>(64999);
  const [editableOrigPrice, setEditableOrigPrice] = useState<number>(79900);
  const [editableCoupon, setEditableCoupon] = useState<string>('BANK5000OFF');
  const [copiedAffiliateUrl, setCopiedAffiliateUrl] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  // Handle Fetch Details from Amazon
  const handleFetch = async (urlOrAsinToFetch?: string) => {
    const targetInput = urlOrAsinToFetch || inputUrl;
    if (!targetInput.trim()) return;

    setIsLoading(true);
    setPublishSuccessMsg(null);

    try {
      let apiData: any = null;
      try {
        const response = await fetch('/api/analyze-deal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlOrText: targetInput })
        });
        const json = await response.json();
        if (json.success && json.data) {
          apiData = json.data;
        }
      } catch (err) {
        console.warn('Backend API fetch error, falling back to local Amazon fetcher:', err);
      }

      const result = await fetchAmazonProductDetails(targetInput, amazonTag);
      
      if (apiData) {
        if (apiData.title) result.title = apiData.title;
        if (apiData.category) result.category = apiData.category;
        if (apiData.originalPrice) result.originalPrice = apiData.originalPrice;
        if (apiData.dealPrice) result.dealPrice = apiData.dealPrice;
        if (apiData.couponCode) result.couponCode = apiData.couponCode;
        if (apiData.imageUrl) result.imageUrl = apiData.imageUrl;
      }

      setFetchedResult(result);
      setSelectedCategory(result.category);
      setEditablePrice(result.dealPrice);
      setEditableOrigPrice(result.originalPrice);
      setEditableCoupon(result.couponCode || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate discount percentage based on edited prices
  const discountPct = Math.max(
    0, 
    Math.round(((editableOrigPrice - editablePrice) / (editableOrigPrice || 1)) * 100)
  );

  // Copy Monitized Affiliate URL
  const handleCopyAffiliate = () => {
    if (!fetchedResult) return;
    navigator.clipboard.writeText(fetchedResult.affiliateUrl);
    setCopiedAffiliateUrl(true);
    setTimeout(() => setCopiedAffiliateUrl(false), 2000);
  };

  // Publish Deal to Monday Bazaar
  const handlePublish = () => {
    if (!fetchedResult) return;

    const newDeal: Deal = {
      id: 'amz_deal_' + Date.now(),
      title: fetchedResult.title,
      description: fetchedResult.description,
      store: 'Amazon',
      category: selectedCategory,
      originalPrice: editableOrigPrice,
      dealPrice: editablePrice,
      discountPercentage: discountPct,
      couponCode: editableCoupon.trim() || undefined,
      imageUrl: fetchedResult.imageUrl,
      dealUrl: fetchedResult.affiliateUrl, // Monitised Amazon link
      isLootDeal: discountPct >= 40,
      isVerified: true,
      upvotes: 35,
      downvotes: 0,
      aiScore: fetchedResult.aiScore,
      aiVerdict: fetchedResult.aiVerdict,
      aiPros: fetchedResult.aiPros,
      aiCons: fetchedResult.aiCons,
      postedAt: 'Just now',
      priceHistory: [
        { date: 'Last Month', price: editableOrigPrice },
        { date: 'Today', price: editablePrice },
      ],
      commentsCount: 0,
      comments: [],
      viewsCount: 180,
      postedBy: `Amazon_Importer (${amazonTag})`,
    };

    onPublishDeal(newDeal);
    setPublishSuccessMsg(`Successfully published "${fetchedResult.title}" into category "${selectedCategory}" with tag "${amazonTag}"!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold border border-amber-500/40">
            <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
            <span>AMAZON AFFILIATE AUTO-PARSER & CATEGORIZER</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Import Amazon Product Links & List by Category
          </h2>
          
          <p className="text-sm text-slate-300 leading-relaxed">
            Paste any Amazon India product URL or ASIN. The system parses product title, price, discount, image, automatically tags your Amazon Associate ID (<strong className="text-amber-400">{amazonTag}</strong>), and lists it in the designated category.
          </p>
        </div>
      </div>

      {/* Input Box & Curated Quick Import */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Fetcher Controls (2 Columns) */}
        <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Search className="w-5 h-5 text-amber-500" />
                <span>Fetch Amazon Product by Link or ASIN</span>
              </h3>
              <p className="text-xs text-slate-500">Supports standard product URLs, short links, or 10-character ASINs</p>
            </div>
            
            <div className="text-right">
              <span className="text-[11px] font-semibold text-slate-400 block">ACTIVE TAG</span>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-mono text-xs font-bold rounded-lg border border-amber-200/80">
                tag={amazonTag}
              </span>
            </div>
          </div>

          {/* Form Input */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Amazon Product Link or ASIN
            </label>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="e.g. https://www.amazon.in/dp/B0CX58S7S9 or B0CX58S7S9"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all"
                />
                <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>

              <button
                onClick={() => handleFetch()}
                disabled={isLoading || !inputUrl.trim()}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 shrink-0"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Fetching Amazon Data...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Fetch Product Details</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick ASIN Helper */}
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
              <span>Sample ASINs:</span>
              <button 
                onClick={() => { setInputUrl('B0CX58S7S9'); handleFetch('B0CX58S7S9'); }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono rounded transition-colors"
              >
                B0CX58S7S9 (iPhone 15)
              </button>
              <button 
                onClick={() => { setInputUrl('B0CHX1M1XP'); handleFetch('B0CHX1M1XP'); }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono rounded transition-colors"
              >
                B0CHX1M1XP (Sony ANC)
              </button>
              <button 
                onClick={() => { setInputUrl('B0B3RRWSF6'); handleFetch('B0B3RRWSF6'); }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono rounded transition-colors"
              >
                B0B3RRWSF6 (MacBook)
              </button>
            </div>
          </div>

          {/* Success Banner Notice */}
          {publishSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-emerald-900 text-sm">{publishSuccessMsg}</p>
                <p className="text-xs text-emerald-700 mt-0.5">This deal is now live on the storefront for all users to browse & buy.</p>
              </div>
            </div>
          )}

        </div>

        {/* Curated Hot Amazon Deals Sidebar (1 Column) */}
        <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Flame className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-white text-sm">Curated Hot Amazon Deals</h3>
              <p className="text-[11px] text-slate-400">1-Click import high-conversion products</p>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
            {CURATED_AMAZON_HOT_DEALS.map((deal) => (
              <div 
                key={deal.asin}
                onClick={() => { setInputUrl(deal.asin); handleFetch(deal.asin); }}
                className="p-3 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="space-y-0.5 max-w-[200px]">
                  <p className="text-xs font-bold text-slate-100 truncate group-hover:text-amber-300 transition-colors">
                    {deal.name}
                  </p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="text-amber-400 font-semibold">{deal.category}</span>
                    <span>•</span>
                    <span className="font-bold text-emerald-400">{deal.dealPrice}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-black rounded">
                    {deal.discount}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ==================== FETCHED PRODUCT LIVE EDITOR CARD ==================== */}
      {fetchedResult && (
        <div className="bg-white rounded-3xl border-2 border-amber-500/40 shadow-lg p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>AMAZON PRODUCT FETCHED</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">ASIN CODE</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{fetchedResult.asin}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyAffiliate}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                {copiedAffiliateUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">Copied Affiliate Link!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Affiliate Link</span>
                  </>
                )}
              </button>

              <a
                href={fetchedResult.affiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                <span>Test Link on Amazon</span>
              </a>
            </div>
          </div>

          {/* Two Column Layout for Fetched Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Image & Badge (4 Cols) */}
            <div className="lg:col-span-4 space-y-4">
              <div className="relative aspect-4/3 bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 p-4 flex items-center justify-center">
                <img
                  src={fetchedResult.imageUrl}
                  alt={fetchedResult.title}
                  className="max-h-full object-contain"
                />
                
                {discountPct > 0 && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>{discountPct}% OFF</span>
                  </div>
                )}

                {fetchedResult.isLootDeal && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    LOOT DEAL
                  </div>
                )}
              </div>

              {/* Monetized Link Preview Box */}
              <div className="p-3.5 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-1.5 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  GENERATED AFFILIATE MONETIZED URL
                </span>
                <p className="font-mono text-[11px] text-slate-200 break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {fetchedResult.affiliateUrl}
                </p>
              </div>
            </div>

            {/* Right Editable Form Details (8 Cols) */}
            <div className="lg:col-span-8 space-y-5">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Product Title
                </label>
                <input
                  type="text"
                  value={fetchedResult.title}
                  onChange={(e) => setFetchedResult({ ...fetchedResult, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Category Assignment (Key requirement) */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
                <label className="block text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  <span>Assign Product Category</span>
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as CategoryName)}
                  className="w-full px-4 py-2.5 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-xs"
                >
                  {CATEGORY_LIST.map((catName) => (
                    <option key={catName} value={catName}>
                      {catName}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-amber-800">
                  The product will be listed under this category on the main website catalog.
                </p>
              </div>

              {/* Pricing Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Original MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={editableOrigPrice}
                    onChange={(e) => setEditableOrigPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Deal Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    value={editablePrice}
                    onChange={(e) => setEditablePrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-bold text-emerald-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={editableCoupon}
                    onChange={(e) => setEditableCoupon(e.target.value)}
                    placeholder="e.g. BANK5000OFF"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 uppercase"
                  />
                </div>
              </div>

              {/* AI Gemini Insights */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>Gemini AI Deal Score: {fetchedResult.aiScore}/100</span>
                  </span>
                  <span className="text-slate-500 font-semibold">{fetchedResult.aiVerdict}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {fetchedResult.aiPros.map((pro, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-medium">
                      ✓ {pro}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setFetchedResult(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors w-full sm:w-auto"
                >
                  Discard & Reset
                </button>

                <button
                  onClick={handlePublish}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Amazon Deal to Category</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
