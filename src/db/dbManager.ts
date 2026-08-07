import fs from 'fs';
import path from 'path';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';

interface DatabaseSchema {
  deals: Deal[];
  affiliateConfigs: Record<string, StoreAffiliateConfig>;
  stats: {
    totalClicks: number;
    totalSavingsGenerated: number;
    updatedAt: string;
  };
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'database.json');

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
          affiliateConfigs: parsed.affiliateConfigs || DEFAULT_AFFILIATE_CONFIGS,
          stats: parsed.stats || { totalClicks: 1250, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
        };
      }
    } catch (err) {
      console.error('Failed reading database file, initializing new DB instance:', err);
    }

    // Default fallback
    const initialDb: DatabaseSchema = {
      deals: INITIAL_DEALS_SEED,
      affiliateConfigs: DEFAULT_AFFILIATE_CONFIGS,
      stats: { totalClicks: 1250, totalSavingsGenerated: 485000, updatedAt: new Date().toISOString() }
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
  public addDeal(dealData: Partial<Deal>): Deal {
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
}

export const dbManager = new DatabaseManager();
