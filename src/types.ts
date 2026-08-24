export type StoreName = 
  | 'Amazon' 
  | 'Flipkart' 
  | 'Myntra' 
  | 'Ajio' 
  | 'Tata CLiQ' 
  | 'Croma' 
  | 'Reliance Digital' 
  | 'Boat' 
  | 'Noise' 
  | 'Samsung' 
  | 'Apple';

export type CategoryName = string;

export interface PriceHistoryPoint {
  date: string;
  price: number;
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: string;
  upvotes: number;
}

export interface Deal {
  id: string;
  title: string;
  description: string;
  store: StoreName;
  category: CategoryName;
  originalPrice: number;
  dealPrice: number;
  discountPercentage: number;
  couponCode?: string;
  imageUrl: string;
  dealUrl: string;
  isLootDeal?: boolean;
  isVerified?: boolean;
  isExpiringSoon?: boolean;
  isActive?: boolean; // Default true, allows admin to set Active / Inactive
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  operatingHours?: Record<string, { open: string; close: string; closed: boolean }>;
  aiScore: number; // 0 to 100
  aiVerdict: string;
  aiPros: string[];
  aiCons: string[];
  postedAt: string;
  createdAt?: string;
  expiryDate?: string;
  priceHistory: PriceHistoryPoint[];
  commentsCount: number;
  comments: Comment[];
  viewsCount: number;
  postedBy: string;
}

export interface StoreInfo {
  name: StoreName;
  logoUrl?: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  accentColor: string;
  dealsCount: number;
  status?: 'open' | 'closed';
}

export interface FilterOptions {
  category: CategoryName;
  store: StoreName | 'All';
  searchQuery: string;
  sortBy: 'hot' | 'discount' | 'price_low' | 'price_high' | 'newest' | 'ai_score';
  onlyLootDeals: boolean;
  onlyCoupons: boolean;
  maxPrice?: number;
}

export interface AIAnalysisRequest {
  urlOrText: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  data?: {
    title: string;
    store: StoreName;
    category: CategoryName;
    originalPrice: number;
    dealPrice: number;
    discountPercentage: number;
    couponCode?: string;
    aiScore: number;
    aiVerdict: string;
    aiPros: string[];
    aiCons: string[];
    isLootDeal: boolean;
    buyRecommendation: 'MUST_BUY' | 'GOOD_DEAL' | 'AVERAGE' | 'WAIT';
    priceHistoryAdvice: string;
  };
  error?: string;
}

export interface PriceAlert {
  id: string;
  dealId: string;
  dealTitle: string;
  targetPrice: number;
  userEmail: string;
  createdAt: string;
}

export interface StoreAffiliateConfig {
  storeName: StoreName;
  tag: string;
  paramName: string;
  isEnabled: boolean;
}
