import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';
import { dbManager, UserRecord, LinkClickRecord, DealViewRecord, SiteBannerConfig, SocialLogRecord } from './dbManager';

export interface SupabaseStatus {
  isConnected: boolean;
  engine: string;
  url: string;
  error?: string;
  migratedDealsCount?: number;
  tables?: string[];
}

class SupabaseDatabaseService {
  private client: SupabaseClient | null = null;
  private isInitialized = false;
  private connectionError: string | null = null;
  public supabaseUrl: string;
  public supabaseKey: string;

  constructor() {
    this.supabaseUrl = (process.env.SUPABASE_URL || 'https://pmvnyxpyypifneqojlqq.supabase.co').trim();
    this.supabaseKey = (process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || 'sb_publishable_QdwxI3KvRW5Ro-vY5XPuQg_Cg4mLVdD').trim();
    this.init();
  }

  private init() {
    if (!this.supabaseUrl || !this.supabaseKey) {
      this.connectionError = 'Supabase credentials missing.';
      console.warn('⚠️ Supabase credentials missing.');
      return;
    }

    try {
      this.client = createClient(this.supabaseUrl, this.supabaseKey, {
        auth: { persistSession: false }
      });
      console.log(`✅ Supabase Client initialized for ${this.supabaseUrl}`);
      this.isInitialized = true;
    } catch (err: any) {
      this.connectionError = err.message;
      console.warn('⚠️ Failed to initialize Supabase client:', err.message);
    }
  }

  // Get Supabase DB Connection & Tables Status
  public async getStatus(): Promise<SupabaseStatus> {
    if (!this.client) {
      return {
        isConnected: false,
        engine: 'Supabase PostgreSQL (Not Configured)',
        url: this.supabaseUrl,
        error: this.connectionError || 'Supabase client not initialized'
      };
    }

    try {
      // Test connectivity by querying deals
      const { data, error } = await this.client.from('deals').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        return {
          isConnected: true,
          engine: 'Supabase Cloud PostgreSQL',
          url: this.supabaseUrl,
          error: `Supabase ping note: ${error.message}`
        };
      }

      return {
        isConnected: true,
        engine: 'Supabase Cloud PostgreSQL',
        url: this.supabaseUrl,
        tables: ['deals', 'users', 'link_clicks', 'deal_views', 'affiliate_configs', 'site_config', 'social_logs']
      };
    } catch (err: any) {
      return {
        isConnected: false,
        engine: 'Supabase Cloud PostgreSQL',
        url: this.supabaseUrl,
        error: err.message
      };
    }
  }

  // Primary Data Migration / Sync Function to Supabase
  public async syncAllDataToSupabase(): Promise<{ success: boolean; migratedDealsCount: number; migratedConfigsCount: number; message: string }> {
    if (!this.client) {
      return { success: false, migratedDealsCount: 0, migratedConfigsCount: 0, message: 'Supabase client unavailable' };
    }

    let dealsCount = 0;
    let configsCount = 0;

    try {
      // 1. Sync Deals
      const localDeals = dbManager.getDeals();
      let tableMissing = false;
      let lastErrorMsg = '';

      for (const deal of localDeals) {
        const payload = {
          id: deal.id,
          title: deal.title,
          description: deal.description || '',
          store: deal.store,
          category: deal.category,
          originalprice: deal.originalPrice,
          dealprice: deal.dealPrice,
          discountpercentage: deal.discountPercentage,
          couponcode: deal.couponCode || null,
          imageurl: deal.imageUrl,
          dealurl: deal.dealUrl,
          islootdeal: deal.isLootDeal || false,
          isverified: deal.isVerified !== false,
          isactive: deal.isActive !== false,
          upvotes: deal.upvotes || 0,
          downvotes: deal.downvotes || 0,
          aiscore: deal.aiScore || 85,
          aiverdict: deal.aiVerdict || '',
          aipros: JSON.stringify(deal.aiPros || []),
          aicons: JSON.stringify(deal.aiCons || []),
          postedat: deal.postedAt || 'Recently',
          postedby: deal.postedBy || 'Community Member',
          viewscount: deal.viewsCount || 0,
          commentscount: deal.commentsCount || 0
        };

        const { error } = await this.client.from('deals').upsert(payload, { onConflict: 'id' });
        if (!error) {
          dealsCount++;
        } else {
          lastErrorMsg = error.message;
          if (error.code === 'PGRST205' || error.message.includes('Could not find the table') || error.message.includes('relation') || error.message.includes('does not exist')) {
            tableMissing = true;
          }
          console.warn(`Supabase deal upsert note (${deal.id}):`, error.message);
        }
      }

      if (tableMissing && dealsCount === 0) {
        return {
          success: false,
          migratedDealsCount: 0,
          migratedConfigsCount: 0,
          message: `Supabase Table Notice: The 'deals' table does not exist in your Supabase project yet. Please run the SQL schema script in your Supabase Dashboard -> SQL Editor to create tables, then click Sync again.`
        };
      }

      if (lastErrorMsg.includes('row-level security') || lastErrorMsg.includes('RLS') || lastErrorMsg.includes('violates row-level security policy')) {
        return {
          success: false,
          migratedDealsCount: 0,
          migratedConfigsCount: 0,
          message: `Supabase RLS Policy Notice: Your Supabase table is blocking write access due to Row-Level Security (RLS). Please open Admin Dashboard -> 📋 SQL Schema, copy the SQL script, run it in Supabase SQL Editor to enable public permissions, and click Sync again.`
        };
      }

      // 2. Sync Affiliate Configs
      const configs = dbManager.getAffiliateConfigs();
      for (const [key, cfg] of Object.entries(configs)) {
        const payload = {
          store_key: key,
          store_name: cfg.store,
          tag: cfg.tagValue,
          parameter_name: cfg.tagParam,
          commission_rate: cfg.commissionRate,
          is_active: cfg.isActive !== false
        };
        const { error } = await this.client.from('affiliate_configs').upsert(payload, { onConflict: 'store_key' });
        if (!error) {
          configsCount++;
        }
      }

      // 3. Sync Users
      const users = dbManager.getUsers();
      for (const user of users) {
        const payload = {
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password || 'admin123',
          role: user.role,
          avatarurl: user.avatarUrl,
          dealsposted: user.dealsPosted
        };
        await this.client.from('users').upsert(payload, { onConflict: 'id' });
      }

      // 4. Sync Site Banner Config
      const banner = dbManager.getSiteBanner();
      if (banner) {
        await this.client.from('site_config').upsert({
          config_key: 'site_banner',
          config_value: JSON.stringify(banner)
        }, { onConflict: 'config_key' });
      }

      console.log(`✅ Supabase migration completed: ${dealsCount} deals & ${configsCount} affiliate configs synced.`);
      return {
        success: true,
        migratedDealsCount: dealsCount,
        migratedConfigsCount: configsCount,
        message: `Successfully migrated ${dealsCount} deals and ${configsCount} store configs to Supabase.`
      };
    } catch (err: any) {
      console.warn('⚠️ Error during Supabase data migration:', err.message);
      return { success: false, migratedDealsCount: dealsCount, migratedConfigsCount: configsCount, message: err.message };
    }
  }

  // Fetch all deals from Supabase with memory fallback
  public async getDeals(): Promise<Deal[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('deals')
          .select('*')
          .order('id', { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            store: r.store as StoreName,
            category: r.category,
            originalPrice: Number(r.originalprice ?? r.originalPrice ?? 0),
            dealPrice: Number(r.dealprice ?? r.dealPrice ?? 0),
            discountPercentage: Number(r.discountpercentage ?? r.discountPercentage ?? 0),
            couponCode: r.couponcode ?? r.couponCode ?? '',
            imageUrl: r.imageurl ?? r.imageUrl ?? '',
            dealUrl: r.dealurl ?? r.dealUrl ?? '',
            isLootDeal: Boolean(r.islootdeal ?? r.isLootDeal),
            isVerified: Boolean(r.isverified ?? r.isVerified),
            isActive: r.isactive !== false && r.isActive !== false,
            upvotes: Number(r.upvotes || 0),
            downvotes: Number(r.downvotes || 0),
            aiScore: Number(r.aiscore ?? r.aiScore ?? 85),
            aiVerdict: r.aiverdict ?? r.aiVerdict ?? '',
            aiPros: r.aipros ? (typeof r.aipros === 'string' ? JSON.parse(r.aipros) : r.aipros) : ['Verified price savings', 'Great seller discount'],
            aiCons: r.aicons ? (typeof r.aicons === 'string' ? JSON.parse(r.aicons) : r.aicons) : ['Limited time deal availability'],
            postedAt: r.postedat ?? r.postedAt ?? 'Recently',
            postedBy: r.postedby ?? r.postedBy ?? 'Community Member',
            viewsCount: Number(r.viewscount ?? r.viewsCount ?? 0),
            commentsCount: Number(r.commentscount ?? r.commentsCount ?? 0),
            priceHistory: [
              { date: 'Previous', price: Number(r.originalprice ?? r.originalPrice ?? 0) },
              { date: 'Today', price: Number(r.dealprice ?? r.dealPrice ?? 0) }
            ],
            comments: []
          }));
        } else if (!error && Array.isArray(data) && data.length === 0) {
          console.log('🌱 Supabase deals table empty, auto-migrating local dataset...');
          await this.syncAllDataToSupabase();
          return dbManager.getDeals();
        }
      } catch (err: any) {
        console.warn('⚠️ Supabase deal fetch note, falling back to local storage:', err.message);
      }
    }
    return dbManager.getDeals();
  }

  // Fetch single deal by ID
  public async getDealById(id: string): Promise<Deal | null> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('deals')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && data) {
          const r = data;
          return {
            id: r.id,
            title: r.title,
            description: r.description,
            store: r.store as StoreName,
            category: r.category,
            originalPrice: Number(r.originalprice ?? r.originalPrice ?? 0),
            dealPrice: Number(r.dealprice ?? r.dealPrice ?? 0),
            discountPercentage: Number(r.discountpercentage ?? r.discountPercentage ?? 0),
            couponCode: r.couponcode ?? r.couponCode ?? '',
            imageUrl: r.imageurl ?? r.imageUrl ?? '',
            dealUrl: r.dealurl ?? r.dealUrl ?? '',
            isLootDeal: Boolean(r.islootdeal ?? r.isLootDeal),
            isVerified: Boolean(r.isverified ?? r.isVerified),
            isActive: r.isactive !== false && r.isActive !== false,
            upvotes: Number(r.upvotes || 0),
            downvotes: Number(r.downvotes || 0),
            aiScore: Number(r.aiscore ?? r.aiScore ?? 85),
            aiVerdict: r.aiverdict ?? r.aiVerdict ?? '',
            aiPros: r.aipros ? (typeof r.aipros === 'string' ? JSON.parse(r.aipros) : r.aipros) : ['Verified price savings'],
            aiCons: r.aicons ? (typeof r.aicons === 'string' ? JSON.parse(r.aicons) : r.aicons) : ['Limited time deal'],
            postedAt: r.postedat ?? r.postedAt ?? 'Recently',
            postedBy: r.postedby ?? r.postedBy ?? 'Community Member',
            viewsCount: Number(r.viewscount ?? r.viewsCount ?? 0),
            commentsCount: Number(r.commentscount ?? r.commentsCount ?? 0),
            priceHistory: [],
            comments: []
          };
        }
      } catch (e) {
        // Fallback to list search
      }
    }
    const deals = await this.getDeals();
    return deals.find(d => d.id === id) || null;
  }

  // Add new deal
  public async addDeal(dealData: Partial<Deal>, allowDuplicate: boolean = false): Promise<Deal> {
    const newDeal = dbManager.addDeal(dealData, allowDuplicate);

    if (this.client) {
      try {
        const payload = {
          id: newDeal.id,
          title: newDeal.title,
          description: newDeal.description || '',
          store: newDeal.store,
          category: newDeal.category,
          originalprice: newDeal.originalPrice,
          dealprice: newDeal.dealPrice,
          discountpercentage: newDeal.discountPercentage,
          couponcode: newDeal.couponCode || null,
          imageurl: newDeal.imageUrl,
          dealurl: newDeal.dealUrl,
          islootdeal: newDeal.isLootDeal || false,
          isverified: newDeal.isVerified !== false,
          isactive: newDeal.isActive !== false,
          upvotes: newDeal.upvotes || 0,
          downvotes: newDeal.downvotes || 0,
          aiscore: newDeal.aiScore || 85,
          aiverdict: newDeal.aiVerdict || '',
          aipros: JSON.stringify(newDeal.aiPros || []),
          aicons: JSON.stringify(newDeal.aiCons || []),
          postedat: newDeal.postedAt || 'Recently',
          postedby: newDeal.postedBy || 'Community Member',
          viewscount: newDeal.viewsCount || 0,
          commentscount: newDeal.commentsCount || 0
        };

        const { error } = await this.client.from('deals').upsert(payload, { onConflict: 'id' });
        if (error) {
          console.warn('Supabase addDeal note:', error.message);
        } else {
          console.log(`✅ Deal ${newDeal.id} successfully saved to Supabase database.`);
        }
      } catch (err: any) {
        console.warn('⚠️ Supabase insert failed:', err.message);
      }
    }

    return newDeal;
  }

  // Update existing deal
  public async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | null> {
    const updated = dbManager.updateDeal(id, updates);

    if (this.client && updated) {
      try {
        const payload: Record<string, any> = {};
        if (updates.title !== undefined) payload.title = updates.title;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.dealPrice !== undefined) payload.dealprice = updates.dealPrice;
        if (updates.originalPrice !== undefined) payload.originalprice = updates.originalPrice;
        if (updates.discountPercentage !== undefined) payload.discountpercentage = updates.discountPercentage;
        if (updates.store !== undefined) payload.store = updates.store;
        if (updates.category !== undefined) payload.category = updates.category;
        if (updates.imageUrl !== undefined) payload.imageurl = updates.imageUrl;
        if (updates.dealUrl !== undefined) payload.dealurl = updates.dealUrl;
        if (updates.couponCode !== undefined) payload.couponcode = updates.couponCode;
        if (updates.isLootDeal !== undefined) payload.islootdeal = updates.isLootDeal;
        if (updates.isActive !== undefined) payload.isactive = updates.isActive;
        if (updates.upvotes !== undefined) payload.upvotes = updates.upvotes;
        if (updates.downvotes !== undefined) payload.downvotes = updates.downvotes;
        if (updates.viewsCount !== undefined) payload.viewscount = updates.viewsCount;

        await this.client.from('deals').update(payload).eq('id', id);
      } catch (err: any) {
        console.warn('Supabase update deal note:', err.message);
      }
    }

    return updated;
  }

  // Delete deal
  public async deleteDeal(id: string): Promise<boolean> {
    const deleted = dbManager.deleteDeal(id);

    if (this.client && deleted) {
      try {
        await this.client.from('deals').delete().eq('id', id);
      } catch (err: any) {
        console.warn('Supabase delete deal note:', err.message);
      }
    }

    return deleted;
  }

  // Vote on deal
  public async voteDeal(id: string, type: 'up' | 'down'): Promise<Deal | null> {
    const deal = dbManager.voteDeal(id, type);
    if (deal && this.client) {
      try {
        await this.client.from('deals').update({
          upvotes: deal.upvotes,
          downvotes: deal.downvotes
        }).eq('id', id);
      } catch (e: any) {
        console.warn('Supabase vote update note:', e.message);
      }
    }
    return deal;
  }

  // Record link click
  public async addLinkClick(record: Omit<LinkClickRecord, 'id' | 'clickedAt'>): Promise<LinkClickRecord> {
    const click = dbManager.recordLinkClick(record);
    if (this.client) {
      try {
        await this.client.from('link_clicks').insert({
          deal_id: click.dealId,
          deal_title: click.dealTitle,
          store: click.store,
          affiliate_url: click.affiliateUrl,
          user_id: click.userId || 'guest',
          ip_address: click.ipAddress || '127.0.0.1'
        });
      } catch (e: any) {
        // Log note
      }
    }
    return click;
  }

  // Record deal view
  public async addDealView(record: Omit<DealViewRecord, 'id' | 'viewedAt'>): Promise<DealViewRecord> {
    const view = dbManager.recordDealView(record);
    if (this.client) {
      try {
        await this.client.from('deal_views').insert({
          deal_id: view.dealId,
          user_id: view.userId || 'guest',
          ip_address: view.ipAddress || '127.0.0.1'
        });
      } catch (e: any) {
        // Log note
      }
    }
    return view;
  }

  // Get users
  public async getUsers(): Promise<UserRecord[]> {
    if (this.client) {
      try {
        const { data, error } = await this.client.from('users').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map((u: any) => ({
            id: u.id,
            username: u.username,
            email: u.email,
            password: u.password || 'admin123',
            role: u.role || 'user',
            avatarUrl: u.avatarurl || u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            dealsPosted: u.dealsposted || u.dealsPosted || 0,
            createdAt: u.created_at || u.createdAt || new Date().toISOString()
          }));
        }
      } catch (e: any) {}
    }
    return dbManager.getUsers();
  }

  // Add user
  public async addUser(userData: Partial<UserRecord>): Promise<UserRecord> {
    const user = dbManager.addUser(userData);
    if (this.client) {
      try {
        await this.client.from('users').upsert({
          id: user.id,
          username: user.username,
          email: user.email,
          password: user.password || 'admin123',
          role: user.role,
          avatarurl: user.avatarUrl,
          dealsposted: user.dealsPosted
        });
      } catch (e: any) {}
    }
    return user;
  }

  // Get affiliate configs
  public async getAffiliateConfigs(): Promise<Record<string, StoreAffiliateConfig>> {
    if (this.client) {
      try {
        const { data, error } = await this.client.from('affiliate_configs').select('*');
        if (!error && Array.isArray(data) && data.length > 0) {
          const res: Record<string, StoreAffiliateConfig> = {};
          data.forEach((r: any) => {
            res[r.store_key] = {
              store: r.store_name as StoreName,
              tagValue: r.tag,
              tagParam: r.parameter_name,
              commissionRate: Number(r.commission_rate || 5.0),
              isActive: r.is_active !== false
            };
          });
          return res;
        }
      } catch (e: any) {}
    }
    return dbManager.getAffiliateConfigs();
  }

  // Save affiliate configs
  public async saveAffiliateConfigs(configs: Record<string, StoreAffiliateConfig>): Promise<Record<string, StoreAffiliateConfig>> {
    const updated = dbManager.updateAffiliateConfigs(configs);
    if (this.client) {
      try {
        for (const [key, cfg] of Object.entries(configs)) {
          await this.client.from('affiliate_configs').upsert({
            store_key: key,
            store_name: cfg.store,
            tag: cfg.tagValue,
            parameter_name: cfg.tagParam,
            commission_rate: cfg.commissionRate,
            is_active: cfg.isActive !== false
          }, { onConflict: 'store_key' });
        }
      } catch (e: any) {}
    }
    return updated;
  }

  // Get site banner
  public async getSiteBanner(): Promise<SiteBannerConfig> {
    if (this.client) {
      try {
        const { data, error } = await this.client
          .from('site_config')
          .select('config_value')
          .eq('config_key', 'site_banner')
          .single();
        if (!error && data?.config_value) {
          return typeof data.config_value === 'string' ? JSON.parse(data.config_value) : data.config_value;
        }
      } catch (e: any) {}
    }
    return dbManager.getSiteBanner();
  }

  // Save site banner
  public async saveSiteBanner(banner: SiteBannerConfig): Promise<SiteBannerConfig> {
    const updated = dbManager.updateSiteBanner(banner);
    if (this.client) {
      try {
        await this.client.from('site_config').upsert({
          config_key: 'site_banner',
          config_value: JSON.stringify(banner)
        }, { onConflict: 'config_key' });
      } catch (e: any) {}
    }
    return updated;
  }
}

export const supabaseDb = new SupabaseDatabaseService();
