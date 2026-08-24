import fs from 'fs';
import path from 'path';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';
import { INITIAL_DEALS } from '../data/initialDeals';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password?: string;
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
  categories?: string[];
  stats: {
    totalClicks: number;
    totalViews: number;
    totalSavingsGenerated: number;
    updatedAt: string;
  };
}

function getDbFilePath(): string {
  if (typeof window !== 'undefined') return '';
  try {
    if (typeof process !== 'undefined' && process.cwd && path && typeof path.join === 'function') {
      return path.join(process.cwd(), 'data', 'database.json');
    }
  } catch (e) {}
  return '';
}

// Initial Users Seed Data
export const INITIAL_USERS_SEED: UserRecord[] = [
  {
    id: 'user_1',
    username: 'DealMaster_Pro',
    email: 'admin@dealsified.com',
    password: 'admin123',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 14,
    createdAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'user_2',
    username: 'AudioLover99',
    email: 'audio@dealsified.com',
    password: 'user123',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 8,
    createdAt: '2026-01-10T12:00:00.000Z'
  },
  {
    id: 'user_3',
    username: 'TechGeek_IN',
    email: 'techgeek@dealsified.com',
    password: 'user123',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 12,
    createdAt: '2026-01-15T08:30:00.000Z'
  },
  {
    id: 'user_4',
    username: 'LootHunter_Raj',
    email: 'raj.loot@dealsified.com',
    password: 'user123',
    role: 'user',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    dealsPosted: 23,
    createdAt: '2026-01-20T14:15:00.000Z'
  },
  {
    id: 'user_demo',
    username: 'You (Demo Member)',
    email: 'godwinrobby@gmail.com',
    password: 'admin123',
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
const INITIAL_DEALS_SEED: Deal[] = INITIAL_DEALS;

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (typeof window !== 'undefined') {
      return {
        deals: INITIAL_DEALS,
        users: INITIAL_USERS_SEED,
        linkClicks: INITIAL_CLICKS_SEED,
        dealViews: INITIAL_VIEWS_SEED,
        affiliateConfigs: DEFAULT_AFFILIATE_CONFIGS,
        categories: ['Mobiles & Tablets', 'Electronics & Laptops', 'Audio & Headphones', 'Fashion & Apparel', 'Home & Kitchen', 'Gaming & Accessories', 'Beauty & Grooming', 'Smartwatches'],
        stats: { totalClicks: 1250, totalViews: 4500, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
      };
    }
    try {
      const dbPath = getDbFilePath();
      if (dbPath && fs && typeof fs.existsSync === 'function') {
        const dir = path.dirname ? path.dirname(dbPath) : dbPath.substring(0, dbPath.lastIndexOf('/'));
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        if (fs.existsSync(dbPath)) {
          const fileContent = fs.readFileSync(dbPath, 'utf-8');
          const parsed = JSON.parse(fileContent);
          const deals = Array.isArray(parsed.deals) && parsed.deals.length > 0 ? parsed.deals : INITIAL_DEALS;
          const loadedDb = {
            deals,
            users: Array.isArray(parsed.users) ? parsed.users : INITIAL_USERS_SEED,
            linkClicks: Array.isArray(parsed.linkClicks) ? parsed.linkClicks : INITIAL_CLICKS_SEED,
            dealViews: Array.isArray(parsed.dealViews) ? parsed.dealViews : INITIAL_VIEWS_SEED,
            affiliateConfigs: parsed.affiliateConfigs || DEFAULT_AFFILIATE_CONFIGS,
            categories: parsed.categories || ['Mobiles & Tablets', 'Electronics & Laptops', 'Audio & Headphones', 'Fashion & Apparel', 'Home & Kitchen', 'Gaming & Accessories', 'Beauty & Grooming', 'Smartwatches'],
            stats: parsed.stats || { totalClicks: 1250, totalViews: 4500, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
          };
          if (!Array.isArray(parsed.deals) || parsed.deals.length === 0) {
            this.saveDatabase(loadedDb);
          }
          return loadedDb;
        }
      }
    } catch (err) {
      console.error('Failed reading database file, initializing new DB instance:', err);
    }

    // Default fallback
    const initialDb: DatabaseSchema = {
      deals: INITIAL_DEALS,
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
    if (typeof window !== 'undefined') return;
    try {
      const dbPath = getDbFilePath();
      if (dbPath && fs && typeof fs.writeFileSync === 'function') {
        const dir = path.dirname ? path.dirname(dbPath) : dbPath.substring(0, dbPath.lastIndexOf('/'));
        if (dir && !fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
      }
    } catch (err) {
      console.error('Failed writing database file:', err);
    }
  }

  // Get all deals
  public getDeals(): Deal[] {
    if (!this.db.deals || this.db.deals.length === 0) {
      this.db.deals = [...INITIAL_DEALS];
      this.saveDatabase(this.db);
    }
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
      createdAt: new Date().toISOString(),
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

  public verifyAdminLogin(identifier: string, pass: string): UserRecord | null {
    const input = identifier.trim().toLowerCase();
    const users = this.getUsers();
    const found = users.find(u => 
      (u.email.toLowerCase() === input || u.username.toLowerCase() === input)
    );

    if (!found) return null;
    if (found.role !== 'admin') return null;

    const expectedPass = found.password || 'admin123';
    if (pass === expectedPass) {
      return found;
    }
    return null;
  }

  public updateUserPassword(userId: string, newPass: string): boolean {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) {
      this.db.users[idx].password = newPass;
      this.saveDatabase(this.db);
      return true;
    }
    return false;
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

  public deleteUser(id: string): boolean {
    const initialLen = this.db.users.length;
    this.db.users = this.db.users.filter(u => u.id !== id && u.email !== id && u.username !== id);
    if (this.db.users.length < initialLen) {
      this.saveDatabase(this.db);
      return true;
    }
    return false;
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

  public getCategories(): string[] {
    return this.db.categories || ['Mobiles & Tablets', 'Electronics & Laptops', 'Audio & Headphones', 'Fashion & Apparel', 'Home & Kitchen', 'Gaming & Accessories', 'Beauty & Grooming', 'Smartwatches'];
  }

  public updateCategories(categories: string[]): string[] {
    this.db.categories = categories;
    this.saveDatabase(this.db);
    return categories;
  }
}

export const dbManager = new DatabaseManager();
