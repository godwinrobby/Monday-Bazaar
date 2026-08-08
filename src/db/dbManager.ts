import fs from 'fs';
import path from 'path';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  avatarUrl: string;
  dealsPosted: number;
  createdAt: string;
}

export interface LinkClickRecord {
  id?: number;
  dealId: string;
  dealTitle: string;
  store: string;
  affiliateUrl: string;
  userId?: string;
  ipAddress?: string;
  clickedAt: string;
}

export interface DealViewRecord {
  id?: number;
  dealId: string;
  userId?: string;
  ipAddress?: string;
  viewedAt: string;
}

export interface SocialConfig {
  facebookEnabled: boolean;
  facebookPageId: string;
  facebookAccessToken: string;
  instagramEnabled: boolean;
  instagramAccountId: string;
  instagramAccessToken: string;
  autoPostOnNewDeal: boolean;
  autoPostLootOnly: boolean;
  postTemplate: string;
}

export interface SocialLogRecord {
  id: string;
  platform: 'facebook' | 'instagram';
  dealId: string;
  dealTitle: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'SIMULATED';
  postUrl?: string;
  message: string;
  postedAt: string;
}

export interface SiteBannerConfig {
  enabled: boolean;
  text: string;
  badge: string;
}

interface DatabaseSchema {
  deals: Deal[];
  users: UserRecord[];
  linkClicks: LinkClickRecord[];
  dealViews: DealViewRecord[];
  affiliateConfigs: Record<string, StoreAffiliateConfig>;
  socialConfig?: SocialConfig;
  socialLogs?: SocialLogRecord[];
  siteBanner?: SiteBannerConfig;
  stats: {
    totalClicks: number;
    totalViews: number;
    totalSavingsGenerated: number;
    updatedAt: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'database.json');

// Initial Users Seed Data
export const INITIAL_USERS_SEED: UserRecord[] = [
  {
    id: 'user_1',
    username: 'DealMaster_Pro',
    email: 'admin@dealsified.com',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 14,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_2',
    username: 'AudioLover99',
    email: 'audio@dealsified.com',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 8,
    createdAt: '2026-01-10T12:00:00.000Z'
  },
  {
    id: 'user_3',
    username: 'TechGeek_IN',
    email: 'techgeek@dealsified.com',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 12,
    createdAt: '2026-01-15T08:30:00.000Z'
  },
  {
    id: 'user_4',
    username: 'LootHunter_Raj',
    email: 'raj.loot@dealsified.com',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 23,
    createdAt: '2026-01-20T14:15:00.000Z'
  },
  {
    id: 'user_demo',
    username: 'You (Demo Member)',
    email: 'godwinrobby@gmail.com',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 5,
    createdAt: '2026-02-01T10:00:00.000Z'
  }
];

// Initial Clicks Seed Data
export const INITIAL_CLICKS_SEED: LinkClickRecord[] = [
  {
    id: 1,
    dealId: 'deal_1',
    dealTitle: 'Apple iPhone 15 (128 GB) - Blue',
    store: 'Amazon',
    affiliateUrl: 'https://www.amazon.in/dp/B0CX58S7S9?tag=mondaybazaar-21',
    userId: 'user_demo',
    ipAddress: '127.0.0.1',
    clickedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 2,
    dealId: 'deal_2',
    dealTitle: 'Sony WH-1000XM5 Wireless Headphones',
    store: 'Amazon',
    affiliateUrl: 'https://www.amazon.in/dp/B0CHX1M1XP?tag=mondaybazaar-21',
    userId: 'user_2',
    ipAddress: '127.0.0.1',
    clickedAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    id: 3,
    dealId: 'deal_4',
    dealTitle: 'boAt Airdopes 141 ANC TWS Earbuds',
    store: 'Boat',
    affiliateUrl: 'https://www.boat-lifestyle.com?affid=mbazaar_boat',
    userId: 'user_4',
    ipAddress: '127.0.0.1',
    clickedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

// Initial Views Seed Data
export const INITIAL_VIEWS_SEED: DealViewRecord[] = [
  { id: 1, dealId: 'deal_1', userId: 'user_demo', ipAddress: '127.0.0.1', viewedAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 2, dealId: 'deal_2', userId: 'user_2', ipAddress: '127.0.0.1', viewedAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 3, dealId: 'deal_3', userId: 'user_3', ipAddress: '127.0.0.1', viewedAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 4, dealId: 'deal_4', userId: 'user_4', ipAddress: '127.0.0.1', viewedAt: new Date(Date.now() - 10800000).toISOString() }
];

// Initial deals array
const INITIAL_DEALS_SEED: Deal[] = [
  {
    id: 'deal_1',
    title: 'Apple iPhone 15 (128 GB) - Blue',
    description: 'Dynamic Island, 48MP main camera with 2x Telephoto, durable color-infused glass and aluminum design, USB-C connector.',
    store: 'Amazon',
    category: 'Mobiles & Tablets',
    originalPrice: 79900,
    dealPrice: 64999,
    discountPercentage: 19,
    couponCode: 'BANK5000OFF',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.amazon.in/dp/B0CX58S7S9?tag=mondaybazaar-21',
    isLootDeal: true,
    isVerified: true,
    upvotes: 428,
    downvotes: 12,
    aiScore: 94,
    aiVerdict: 'All-time low price for iPhone 15 on Amazon India with flat bank discount.',
    aiPros: ['Flat ₹5,000 SBI Card Instant Discount', 'Type-C Port & Dynamic Island', 'Highest resale value'],
    aiCons: ['Standard 60Hz display refresh rate'],
    postedAt: '12 mins ago',
    priceHistory: [
      { date: 'Jan 2026', price: 72999 },
      { date: 'Feb 2026', price: 68999 },
      { date: 'Today', price: 64999 },
    ],
    commentsCount: 18,
    comments: [],
    viewsCount: 3420,
    postedBy: 'DealMaster_Pro',
  },
  {
    id: 'deal_2',
    title: 'Sony WH-1000XM5 Wireless Industry Leading ANC Headphones',
    description: 'Auto NC Optimizer, 30hr Battery Life, Multi-point Connection, Ultra Clear Call Quality with AI Noise Reduction.',
    store: 'Amazon',
    category: 'Audio & Headphones',
    originalPrice: 34990,
    dealPrice: 24990,
    discountPercentage: 29,
    couponCode: 'SONY2000OFF',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.amazon.in/dp/B0CHX1M1XP?tag=mondaybazaar-21',
    isLootDeal: true,
    isVerified: true,
    upvotes: 312,
    downvotes: 8,
    aiScore: 96,
    aiVerdict: 'Best noise-cancelling headphones on the market at 29% price reduction.',
    aiPros: ['Unmatched ANC performance', 'Super comfortable lightweight build', '30hr fast charge battery'],
    aiCons: ['Does not fold completely compact like XM4'],
    postedAt: '45 mins ago',
    priceHistory: [
      { date: 'Jan 2026', price: 29990 },
      { date: 'Feb 2026', price: 27990 },
      { date: 'Today', price: 24990 },
    ],
    commentsCount: 24,
    comments: [],
    viewsCount: 2150,
    postedBy: 'AudioLover99',
  },
  {
    id: 'deal_3',
    title: 'Apple MacBook Air Laptop M2 chip (13.6-inch, 8GB RAM, 256GB SSD) - Starlight',
    description: 'Incredibly thin design, 13.6-inch Liquid Retina Display, 8GB Unified Memory, Backlit Keyboard, 1080p FaceTime HD Camera.',
    store: 'Amazon',
    category: 'Electronics & Laptops',
    originalPrice: 114900,
    dealPrice: 83990,
    discountPercentage: 27,
    couponCode: 'MACM2SAVER',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.amazon.in/dp/B0B3RRWSF6?tag=mondaybazaar-21',
    isLootDeal: true,
    isVerified: true,
    upvotes: 560,
    downvotes: 14,
    aiScore: 98,
    aiVerdict: 'Steal deal for students and professionals. M2 chip delivers legendary battery life.',
    aiPros: ['18 hours continuous battery life', 'MagSafe 3 charging port', 'Fanless quiet operation'],
    aiCons: ['256GB base storage capacity'],
    postedAt: '2 hours ago',
    priceHistory: [
      { date: 'Jan 2026', price: 92990 },
      { date: 'Feb 2026', price: 87990 },
      { date: 'Today', price: 83990 },
    ],
    commentsCount: 39,
    comments: [],
    viewsCount: 5120,
    postedBy: 'TechGeek_IN',
  },
  {
    id: 'deal_4',
    title: 'boAt Airdopes 141 ANC TWS Earbuds with 42H Playtime',
    description: '32dB Active Noise Cancellation, Beast Mode for Low Latency Gaming, ENx Tech for clear voice calls.',
    store: 'Boat',
    category: 'Audio & Headphones',
    originalPrice: 4490,
    dealPrice: 1299,
    discountPercentage: 71,
    couponCode: 'BOAT200',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.boat-lifestyle.com?affid=mbazaar_boat',
    isLootDeal: true,
    isVerified: true,
    upvotes: 890,
    downvotes: 45,
    aiScore: 91,
    aiVerdict: 'Loot Deal! True wireless ANC earbuds under ₹1,300 with 42 hours battery.',
    aiPros: ['Massive 71% discount', 'Active Noise Cancellation included', 'Fast ASAP charging'],
    aiCons: ['Plastic case finish'],
    postedAt: '3 hours ago',
    priceHistory: [
      { date: 'Jan 2026', price: 1999 },
      { date: 'Feb 2026', price: 1599 },
      { date: 'Today', price: 1299 },
    ],
    commentsCount: 52,
    comments: [],
    viewsCount: 7890,
    postedBy: 'LootHunter_Raj',
  }
];

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          deals: Array.isArray(parsed.deals) ? parsed.deals : INITIAL_DEALS_SEED,
          users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS_SEED,
          linkClicks: Array.isArray(parsed.linkClicks) ? parsed.linkClicks : INITIAL_CLICKS_SEED,
          dealViews: Array.isArray(parsed.dealViews) ? parsed.dealViews : INITIAL_VIEWS_SEED,
          affiliateConfigs: parsed.affiliateConfigs || DEFAULT_AFFILIATE_CONFIGS,
          stats: parsed.stats || { totalClicks: 1250, totalViews: 4500, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
        };
      }
    } catch (err) {
      console.error('Failed reading database file, initializing new DB instance:', err);
    }

    // Default fallback
    const initialDb: DatabaseSchema = {
      deals: INITIAL_DEALS_SEED,
      users: INITIAL_USERS_SEED,
      linkClicks: INITIAL_CLICKS_SEED,
      dealViews: INITIAL_VIEWS_SEED,
      affiliateConfigs: DEFAULT_AFFILIATE_CONFIGS,
      stats: { totalClicks: 1250, totalViews: 4500, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
    };
    this.saveDatabase(initialDb);
    return initialDb;
  }

  private saveDatabase(data: DatabaseSchema): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed writing database file:', err);
    }
  }

  // Get all deals
  public getDeals(): Deal[] {
    return this.db.deals;
  }

  // Get single deal by ID
  public getDealById(id: string): Deal | undefined {
    return this.db.deals.find(d => d.id === id);
  }

  // Insert new deal
  public addDeal(dealData: Partial<Deal>, allowDuplicate: boolean = false): Deal {
    const titleTrim = (dealData.title || '').trim().toLowerCase();
    const urlTrim = (dealData.dealUrl || '').trim().toLowerCase();

    if (!allowDuplicate && (titleTrim || urlTrim)) {
      const match = this.db.deals.find(d => 
        (titleTrim && d.title.trim().toLowerCase() === titleTrim) ||
        (urlTrim && urlTrim !== 'https://www.amazon.in' && urlTrim !== 'https://amazon.in' && d.dealUrl.trim().toLowerCase() === urlTrim)
      );
      if (match) {
        throw new Error(`Duplicate Deal Error: A deal with this title or link already exists in the database ("${match.title}")!`);
      }
    }

    const newDeal: Deal = {
      id: dealData.id || `deal_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title: dealData.title || 'Untitled Deal',
      description: dealData.description || '',
      store: (dealData.store as any) || 'Amazon',
      category: (dealData.category as any) || 'Electronics & Laptops',
      originalPrice: dealData.originalPrice || 0,
      dealPrice: dealData.dealPrice || 0,
      discountPercentage: dealData.discountPercentage || 0,
      couponCode: dealData.couponCode,
      imageUrl: dealData.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      dealUrl: dealData.dealUrl || 'https://amazon.in',
      isLootDeal: dealData.isLootDeal || false,
      isVerified: true,
      upvotes: dealData.upvotes || 1,
      downvotes: dealData.downvotes || 0,
      aiScore: dealData.aiScore || 85,
      aiVerdict: dealData.aiVerdict || 'Verified deal value.',
      aiPros: dealData.aiPros || ['Great value for money'],
      aiCons: dealData.aiCons || ['Check stock availability'],
      postedAt: 'Just now',
      priceHistory: dealData.priceHistory || [
        { date: 'Previous', price: dealData.originalPrice || 0 },
        { date: 'Today', price: dealData.dealPrice || 0 }
      ],
      commentsCount: 0,
      comments: [],
      viewsCount: 1,
      postedBy: dealData.postedBy || 'Community Member',
    };

    this.db.deals.unshift(newDeal);
    this.db.stats.updatedAt = new Date().toISOString();
    this.saveDatabase(this.db);
    return newDeal;
  }

  // Update deal
  public updateDeal(id: string, updatedFields: Partial<Deal>): Deal | null {
    const index = this.db.deals.findIndex(d => d.id === id);
    if (index === -1) return null;

    this.db.deals[index] = {
      ...this.db.deals[index],
      ...updatedFields,
    };
    this.db.stats.updatedAt = new Date().toISOString();
    this.saveDatabase(this.db);
    return this.db.deals[index];
  }

  // Delete deal
  public deleteDeal(id: string): boolean {
    const initialLen = this.db.deals.length;
    this.db.deals = this.db.deals.filter(d => d.id !== id);
    if (this.db.deals.length !== initialLen) {
      this.db.stats.updatedAt = new Date().toISOString();
      this.saveDatabase(this.db);
      return true;
    }
    return false;
  }

  // Handle Voting
  public voteDeal(id: string, voteType: 'up' | 'down'): Deal | null {
    const deal = this.db.deals.find(d => d.id === id);
    if (!deal) return null;

    if (voteType === 'up') deal.upvotes += 1;
    else deal.downvotes += 1;

    this.saveDatabase(this.db);
    return deal;
  }

  // Get Affiliate Configs
  public getAffiliateConfigs(): Record<string, StoreAffiliateConfig> {
    return this.db.affiliateConfigs;
  }

  // Save Affiliate Configs
  public updateAffiliateConfigs(configs: Record<string, StoreAffiliateConfig>): Record<string, StoreAffiliateConfig> {
    this.db.affiliateConfigs = {
      ...this.db.affiliateConfigs,
      ...configs,
    };
    this.saveDatabase(this.db);
    return this.db.affiliateConfigs;
  }

  // --- USER MANAGEMENT ---
  public getUsers(): UserRecord[] {
    return this.db.users || INITIAL_USERS_SEED;
  }

  public addUser(userData: Partial<UserRecord>): UserRecord {
    const newUser: UserRecord = {
      id: userData.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: userData.username || 'Anonymous Deal Hunter',
      email: userData.email || 'user@dealsified.com',
      role: userData.role || 'user',
      avatarUrl: userData.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      dealsPosted: userData.dealsPosted || 0,
      createdAt: userData.createdAt || new Date().toISOString()
    };

    const existingIndex = this.db.users.findIndex(u => u.id === newUser.id || u.email === newUser.email);
    if (existingIndex >= 0) {
      this.db.users[existingIndex] = { ...this.db.users[existingIndex], ...newUser };
    } else {
      this.db.users.push(newUser);
    }

    this.saveDatabase(this.db);
    return newUser;
  }

  // --- LINK CLICK TRACKING ---
  public getLinkClicks(): LinkClickRecord[] {
    return this.db.linkClicks || INITIAL_CLICKS_SEED;
  }

  public recordLinkClick(clickData: {
    dealId: string;
    dealTitle?: string;
    store?: string;
    affiliateUrl?: string;
    userId?: string;
    ipAddress?: string;
  }): LinkClickRecord {
    const deal = this.getDealById(clickData.dealId);
    const newClick: LinkClickRecord = {
      id: (this.db.linkClicks.length || 0) + 1,
      dealId: clickData.dealId,
      dealTitle: clickData.dealTitle || (deal ? deal.title : 'Unspecified Deal'),
      store: clickData.store || (deal ? deal.store : 'Store'),
      affiliateUrl: clickData.affiliateUrl || (deal ? deal.dealUrl : ''),
      userId: clickData.userId || 'user_anonymous',
      ipAddress: clickData.ipAddress || '127.0.0.1',
      clickedAt: new Date().toISOString()
    };

    this.db.linkClicks.unshift(newClick);
    this.db.stats.totalClicks = (this.db.stats.totalClicks || 0) + 1;
    this.saveDatabase(this.db);
    return newClick;
  }

  // --- DEAL VIEW TRACKING ---
  public getDealViews(): DealViewRecord[] {
    return this.db.dealViews || INITIAL_VIEWS_SEED;
  }

  public recordDealView(viewData: {
    dealId: string;
    userId?: string;
    ipAddress?: string;
  }): DealViewRecord {
    const deal = this.getDealById(viewData.dealId);
    if (deal) {
      deal.viewsCount = (deal.viewsCount || 0) + 1;
    }

    const newView: DealViewRecord = {
      id: (this.db.dealViews.length || 0) + 1,
      dealId: viewData.dealId,
      userId: viewData.userId || 'user_anonymous',
      ipAddress: viewData.ipAddress || '127.0.0.1',
      viewedAt: new Date().toISOString()
    };

    this.db.dealViews.unshift(newView);
    this.db.stats.totalViews = (this.db.stats.totalViews || 0) + 1;
    this.saveDatabase(this.db);
    return newView;
  }

  // --- SOCIAL AUTO-POSTING CONFIG & LOGS ---
  public getSocialConfig(): SocialConfig {
    const defaultConfig: SocialConfig = {
      facebookEnabled: false,
      facebookPageId: process.env.FACEBOOK_PAGE_ID || '',
      facebookAccessToken: process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '',
      instagramEnabled: false,
      instagramAccountId: process.env.INSTAGRAM_ACCOUNT_ID || '',
      instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN || '',
      autoPostOnNewDeal: true,
      autoPostLootOnly: false,
      postTemplate: `🔥 {title}\n💰 Deal Price: ₹{dealPrice} (MRP: ₹{originalPrice}) - {discountPercentage}% OFF!\n🏪 Store: {store}\n{couponCodeText}\n👉 Grab Deal Now: {dealUrl}\n\n#Dealsified #{store}Deals #LootDeal #OnlineShopping #Discounts`
    };

    return {
      ...defaultConfig,
      ...(this.db.socialConfig || {})
    };
  }

  public updateSocialConfig(config: Partial<SocialConfig>): SocialConfig {
    const current = this.getSocialConfig();
    const updated = { ...current, ...config };
    this.db.socialConfig = updated;
    this.saveDatabase(this.db);
    return updated;
  }

  public getSocialLogs(): SocialLogRecord[] {
    return this.db.socialLogs || [];
  }

  public addSocialLog(logData: Partial<SocialLogRecord>): SocialLogRecord {
    if (!this.db.socialLogs) {
      this.db.socialLogs = [];
    }
    const newLog: SocialLogRecord = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      platform: logData.platform || 'facebook',
      dealId: logData.dealId || '',
      dealTitle: logData.dealTitle || 'Loot Deal',
      status: logData.status || 'SUCCESS',
      postUrl: logData.postUrl,
      message: logData.message || 'Successfully posted to feed',
      postedAt: new Date().toISOString()
    };

    this.db.socialLogs.unshift(newLog);
    // Keep last 100 logs
    if (this.db.socialLogs.length > 100) {
      this.db.socialLogs = this.db.socialLogs.slice(0, 100);
    }
    this.saveDatabase(this.db);
    return newLog;
  }

  public clearSocialLogs(): boolean {
    this.db.socialLogs = [];
    this.saveDatabase(this.db);
    return true;
  }

  // --- SITE BANNER CONFIG ---
  public getSiteBanner(): SiteBannerConfig {
    const defaultConfig: SiteBannerConfig = {
      enabled: true,
      text: '🔥 Monday Bazaar Super Sale is LIVE! Grab exclusive coupons & loot deals across Amazon, Flipkart & Myntra.',
      badge: 'FLASH LOOT SALE'
    };
    return {
      ...defaultConfig,
      ...(this.db.siteBanner || {})
    };
  }

  public updateSiteBanner(config: Partial<SiteBannerConfig>): SiteBannerConfig {
    const current = this.getSiteBanner();
    const updated = { ...current, ...config };
    this.db.siteBanner = updated;
    this.saveDatabase(this.db);
    return updated;
  }
}

export const dbManager = new DatabaseManager();
