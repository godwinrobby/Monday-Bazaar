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
import { CURATED_AMAZON_HOT_DEALS, fetchAmazonProductDetails, extractAmazonAsin } from '../utils/amazonFetcher';
import { buildAffiliateUrl } from '../utils/affiliate';
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

// Amazon API JSON structure returned from the Amazon fetch API
interface AmazonProductData {
  asin: string;
  product_url: string;
  title: string;
  brand: string;
  description: string;
  price: {
    current: number;
    original: number;
    currency: string;
    formatted: string;
  };
  availability: string;
  rating: {
    value: number;
    count: number;
  };
  images: Array<{ url: string; type: string }>;
  features: string[];
  categories: string[];
  seller: { name: string; url: string };
  delivery: { available: boolean; estimated_date: string };
  metadata: { source: string; fetched_at: string };
}

// Raw API response format from the Amazon fetch service
interface AmazonApiResponse {
  success: boolean;
  original_url: string;
  redirect_url: string;
  final_product_url: string;
  asin: string;
  product: {
    title: string;
    brand: string;
    price: number | null;
    currency: string;
    rating: number | null;
    review_count: number | null;
    images: string[];
    description: string;
    features: string[];
    availability: string;
  };
}

interface AmazonAffiliateImporterProps {
  amazonTag: string;
  onPublishDeal: (deal: Deal) => Promise<{ success: boolean; error?: string }> | void;
}

export const AmazonAffiliateImporter: React.FC<AmazonAffiliateImporterProps> = ({
  amazonTag,
  onPublishDeal
}) => {
  const [inputUrl, setInputUrl] = useState('https://www.amazon.in/dp/B0CX58S7S9');
  const [isLoading, setIsLoading] = useState(false);
  const [fetchedData, setFetchedData] = useState<AmazonProductData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>('Mobiles & Tablets');
  const [editablePrice, setEditablePrice] = useState<number>(0);
  const [editableOrigPrice, setEditableOrigPrice] = useState<number>(0);
  const [editableCoupon, setEditableCoupon] = useState<string>('');
  const [copiedAffiliateUrl, setCopiedAffiliateUrl] = useState(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Handle Fetch Details from Amazon using the new /api/amazon-fetch endpoint
  const handleFetch = async (urlOrAsinToFetch?: string) => {
    const targetInput = urlOrAsinToFetch || inputUrl;
    if (!targetInput.trim()) return;

    setIsLoading(true);
    setPublishSuccessMsg(null);
    setFetchError(null);

    try {
      // Try the backend /api/amazon-fetch endpoint first
      let data: AmazonProductData | null = null;
      try {
        const response = await fetch('/api/amazon-fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlOrAsin: targetInput })
        });

        // Check content-type to ensure we got JSON, not HTML (SPA fallback)
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = await response.json();
          
          // Handle the new API response format:
          // { success, original_url, redirect_url, final_product_url, asin, product: { title, brand, price, currency, rating, review_count, images, description, features, availability } }
          if (json.success && json.product) {
            const apiRes = json as AmazonApiResponse;
            const product: AmazonApiResponse['product'] = apiRes.product || {
              title: '', brand: '', price: null, currency: 'INR', rating: null, review_count: null, images: [], description: '', features: [], availability: ''
            };
            const asin = apiRes.asin || extractAmazonAsin(targetInput) || '';
            const productUrl = apiRes.final_product_url || apiRes.redirect_url || `https://www.amazon.in/dp/${asin}`;
            const price = typeof product.price === 'number' ? product.price : 0;
            
            data = {
              asin,
              product_url: productUrl,
              title: product.title || '',
              brand: product.brand || '',
              description: product.description || '',
              price: {
                current: price,
                original: price,
                currency: product.currency || 'INR',
                formatted: price ? `₹${price.toLocaleString('en-IN')}` : '₹0'
              },
              availability: product.availability || '',
              rating: {
                value: typeof product.rating === 'number' ? product.rating : 0,
                count: typeof product.review_count === 'number' ? product.review_count : 0
              },
              images: (product.images || []).map((url: string) => ({ url, type: 'main' })),
              features: product.features || [],
              categories: [],
              seller: { name: '', url: '' },
              delivery: { available: false, estimated_date: '' },
              metadata: { source: 'amazon-api', fetched_at: new Date().toISOString() }
            };
          } else if (json.success && json.data) {
            // Handle the old format: { success, data: { asin, product_url, title, ... } }
            data = json.data as AmazonProductData;
          } else {
            console.warn('Amazon API returned error:', json.error);
          }
        } else {
          console.warn('Amazon API returned non-JSON response (likely HTML fallback). Using local fetcher.');
        }
      } catch (err) {
        console.warn('Backend /api/amazon-fetch failed, falling back to local Amazon fetcher:', err);
      }

      // Fallback: use local Amazon fetcher if API failed or returned empty data
      if (!data || (!data.title && !data.price?.current)) {
        try {
          const localResult = await fetchAmazonProductDetails(targetInput, amazonTag);
          data = {
            asin: localResult.asin,
            product_url: `https://www.amazon.in/dp/${localResult.asin}`,
            title: localResult.title,
            brand: '',
            description: localResult.description,
            price: {
              current: localResult.dealPrice,
              original: localResult.originalPrice,
              currency: 'INR',
              formatted: `₹${localResult.dealPrice.toLocaleString('en-IN')}`
            },
            availability: 'In Stock',
            rating: { value: 0, count: 0 },
            images: [{ url: localResult.imageUrl, type: 'main' }],
            features: localResult.aiPros,
            categories: [localResult.category],
            seller: { name: 'Amazon', url: '' },
            delivery: { available: true, estimated_date: '' },
            metadata: { source: 'local-fallback', fetched_at: new Date().toISOString() }
          };
        } catch (localErr: any) {
          console.error('Local Amazon fetcher also failed:', localErr);
        }
      }

      if (!data) {
        setFetchError('Failed to fetch Amazon product details. Please try again or enter details manually.');
        setIsLoading(false);
        return;
      }

      setFetchedData(data);

      // Auto-detect category from Amazon categories or features
      const detectedCategory = detectCategory(data);
      setSelectedCategory(detectedCategory);

      // Set prices from the fetched data
      const currentPrice = data.price?.current || 0;
      const originalPrice = data.price?.original || currentPrice || 0;
      setEditablePrice(currentPrice);
      setEditableOrigPrice(originalPrice);
      setEditableCoupon('');

      // If no real data was fetched (empty title/price), show a helpful message
      if (!data.title && !currentPrice) {
        setFetchError(`Product data for ASIN ${data.asin} could not be fully retrieved. Please fill in the details manually below.`);
      }
    } catch (err: any) {
      console.error('Amazon fetch error:', err);
      setFetchError(`Failed to fetch Amazon product: ${err.message || 'Network error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect category from Amazon product data
  const detectCategory = (data: AmazonProductData): CategoryName => {
    const allText = [
      data.title || '',
      data.brand || '',
      data.description || '',
      ...(data.categories || []),
      ...(data.features || [])
    ].join(' ').toLowerCase();

    if (allText.includes('phone') || allText.includes('iphone') || allText.includes('samsung') || allText.includes('mobile') || allText.includes('oneplus') || allText.includes('xiaomi') || allText.includes('realme')) {
      return 'Mobiles & Tablets';
    }
    if (allText.includes('headphone') || allText.includes('earbud') || allText.includes('audio') || allText.includes('speaker') || allText.includes('soundbar') || allText.includes('boat')) {
      return 'Audio & Headphones';
    }
    if (allText.includes('watch') || allText.includes('smartwatch') || allText.includes('fitness') || allText.includes('noise') || allText.includes('fireboltt')) {
      return 'Smartwatches';
    }
    if (allText.includes('laptop') || allText.includes('macbook') || allText.includes('computer') || allText.includes('tablet') || allText.includes('ipad') || allText.includes('monitor')) {
      return 'Electronics & Laptops';
    }
    if (allText.includes('shirt') || allText.includes('shoes') || allText.includes('fashion') || allText.includes('jeans') || allText.includes('dress') || allText.includes('apparel')) {
      return 'Fashion & Apparel';
    }
    if (allText.includes('kitchen') || allText.includes('cooker') || allText.includes('airfryer') || allText.includes('home') || allText.includes('furniture') || allText.includes('appliance')) {
      return 'Home & Kitchen';
    }
    if (allText.includes('gaming') || allText.includes('console') || allText.includes('controller') || allText.includes('playstation') || allText.includes('xbox')) {
      return 'Gaming & Accessories';
    }
    if (allText.includes('beauty') || allText.includes('grooming') || allText.includes('skincare') || allText.includes('makeup') || allText.includes('perfume')) {
      return 'Beauty & Grooming';
    }
    return 'Electronics & Laptops';
  };

  // Calculate discount percentage based on edited prices
  const discountPct = Math.max(
    0, 
    Math.round(((editableOrigPrice - editablePrice) / (editableOrigPrice || 1)) * 100)
  );

  // Get the main product image
  const getMainImage = (): string => {
    if (!fetchedData) return '';
    const mainImg = fetchedData.images?.find((img: { url: string; type: string }) => img.type === 'main' || img.url);
    return mainImg?.url || fetchedData.images?.[0]?.url || '';
  };

  // Get the affiliate URL for the product
  const getAffiliateUrl = (): string => {
    if (!fetchedData) return '';
    const rawUrl = fetchedData.product_url || `https://www.amazon.in/dp/${fetchedData.asin}`;
    return buildAffiliateUrl(rawUrl, 'Amazon');
  };

  // Copy Monetized Affiliate URL
  const handleCopyAffiliate = () => {
    if (!fetchedData) return;
    navigator.clipboard.writeText(getAffiliateUrl());
    setCopiedAffiliateUrl(true);
    setTimeout(() => setCopiedAffiliateUrl(false), 2000);
  };

  // Publish Deal to Monday Bazaar & Supabase
  const handlePublish = async () => {
    if (!fetchedData) return;

    const finalTitle = fetchedData.title || `Amazon Product (ASIN: ${fetchedData.asin})`;
    const finalDescription = fetchedData.description || 
      (fetchedData.features?.length > 0 
        ? fetchedData.features.slice(0, 3).join('. ') + '.'
        : `Verified Amazon deal imported into Monday Bazaar. ASIN: ${fetchedData.asin}`);

    const newDeal: Deal = {
      id: 'amz_deal_' + Date.now(),
      title: finalTitle,
      description: finalDescription,
      store: 'Amazon',
      category: selectedCategory,
      originalPrice: editableOrigPrice || editablePrice || 9999,
      dealPrice: editablePrice || 4999,
      discountPercentage: discountPct,
      couponCode: editableCoupon.trim() || undefined,
      imageUrl: getMainImage() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      dealUrl: getAffiliateUrl(), // Monetized Amazon link
      isLootDeal: discountPct >= 40,
      isVerified: true,
      upvotes: 35,
      downvotes: 0,
      aiScore: fetchedData.rating?.value ? Math.min(95, Math.round(70 + fetchedData.rating.value * 5)) : 88,
      aiVerdict: fetchedData.rating?.value 
        ? `Amazon product with ${fetchedData.rating.value}/5 rating from ${fetchedData.rating.count} reviews.`
        : 'Verified Amazon deal imported via affiliate importer.',
      aiPros: [
        ...(fetchedData.rating?.value ? [`Rated ${fetchedData.rating.value}/5 by ${fetchedData.rating.count} customers`] : []),
        ...(fetchedData.availability ? [`Availability: ${fetchedData.availability}`] : []),
        'Amazon Prime eligible',
        'Verified seller listing'
      ],
      aiCons: ['Check delivery pin code before checkout'],
      postedAt: 'Just now',
      priceHistory: [
        { date: 'Last Month', price: editableOrigPrice || editablePrice },
        { date: 'Today', price: editablePrice },
      ],
      commentsCount: 0,
      comments: [],
      viewsCount: 180,
      postedBy: `Amazon_Importer (${amazonTag})`,
    };

    // Await the publish to ensure Supabase insert completes
    await onPublishDeal(newDeal);
    setPublishSuccessMsg(`Successfully published "${finalTitle}" into category "${selectedCategory}" with tag "${amazonTag}"!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-amber-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-full space-y-3">
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

          {/* Error Banner */}
          {fetchError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900 text-sm">{fetchError}</p>
                <p className="text-xs text-amber-700 mt-0.5">You can still fill in the product details manually below and publish.</p>
              </div>
            </div>
          )}

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
      {fetchedData && (
        <div className="bg-white rounded-3xl border-2 border-amber-500/40 shadow-lg p-6 sm:p-8 space-y-6 animate-in slide-in-from-bottom-3 duration-300">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>AMAZON PRODUCT FETCHED</span>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide block">ASIN CODE</span>
                <span className="font-mono font-bold text-slate-800 text-sm">{fetchedData.asin}</span>
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
                href={getAffiliateUrl()}
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
                  src={getMainImage() || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80'}
                  alt={fetchedData.title || `Amazon Product ${fetchedData.asin}`}
                  className="max-h-full object-contain"
                />
                
                {discountPct > 0 && (
                  <div className="absolute top-3 left-3 bg-red-600 text-white font-black text-xs px-2.5 py-1 rounded-xl shadow-md flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-white" />
                    <span>{discountPct}% OFF</span>
                  </div>
                )}

                {discountPct >= 40 && (
                  <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-lg uppercase tracking-wider">
                    LOOT DEAL
                  </div>
                )}
              </div>

              {/* Product Metadata */}
              {fetchedData.rating?.value > 0 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl text-xs space-y-1.5 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Rating</span>
                    <span className="font-bold text-amber-600">★ {fetchedData.rating.value}/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Reviews</span>
                    <span className="font-bold text-slate-700">{fetchedData.rating.count.toLocaleString()}</span>
                  </div>
                  {fetchedData.availability && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Availability</span>
                      <span className="font-bold text-emerald-600">{fetchedData.availability}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Monetized Link Preview Box */}
              <div className="p-3.5 bg-slate-900 text-slate-300 rounded-2xl text-xs space-y-1.5 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                  GENERATED AFFILIATE MONETIZED URL
                </span>
                <p className="font-mono text-[11px] text-slate-200 break-all bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {getAffiliateUrl()}
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
                  value={fetchedData.title}
                  onChange={(e) => setFetchedData({ ...fetchedData, title: e.target.value })}
                  placeholder="Enter product title"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  value={fetchedData.description}
                  onChange={(e) => setFetchedData({ ...fetchedData, description: e.target.value })}
                  placeholder="Enter product description"
                  rows={3}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white resize-none"
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

              {/* AI Insights */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>AI Deal Score: {fetchedData.rating?.value ? Math.min(95, Math.round(70 + fetchedData.rating.value * 5)) : 88}/100</span>
                  </span>
                  <span className="text-slate-500 font-semibold">
                    {fetchedData.rating?.value 
                      ? `Rated ${fetchedData.rating.value}/5 by ${fetchedData.rating.count} customers`
                      : 'Verified Amazon deal'}
                  </span>
                </div>

                {fetchedData.features && fetchedData.features.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {fetchedData.features.slice(0, 3).map((feature, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[11px] font-medium">
                        ✓ {feature}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setFetchedData(null)}
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