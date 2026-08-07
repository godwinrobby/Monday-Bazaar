import mysql from 'mysql2/promise';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';
import { dbManager, UserRecord, LinkClickRecord, DealViewRecord } from './dbManager';

export interface MySqlStatus {
  isConnected: boolean;
  engine: string;
  host?: string;
  port?: number;
  user?: string;
  database?: string;
  error?: string;
  tables: string[];
}

class MySqlDatabaseService {
  private pool: mysql.Pool | null = null;
  private isInitialized = false;
  private connectionError: string | null = null;

  constructor() {
    this.initPool();
  }

  private initPool() {
    const host = (process.env.MYSQL_HOST || process.env.DB_HOST || '').trim() || 'srv625.hstgr.io';
    const user = (process.env.MYSQL_USER || process.env.DB_USER || '').trim() || 'u179476470_dealusr';
    const password = (process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '').trim() || '$VVg9rB8u9';
    const database = (process.env.MYSQL_DATABASE || process.env.DB_NAME || '').trim() || 'u179476470_dealdb';
    const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306) || 3306;
    const mysqlUri = (process.env.MYSQL_URI || process.env.DATABASE_URL || '').trim();

    if (mysqlUri && mysqlUri.startsWith('mysql')) {
      try {
        this.pool = mysql.createPool(mysqlUri);
        console.log('✅ MySQL Pool created via MYSQL_URI');
      } catch (err: any) {
        this.connectionError = err.message;
        console.warn('⚠️ Could not create MySQL pool via URI:', err.message);
      }
    } else if (host && user) {
      try {
        this.pool = mysql.createPool({
          host,
          port,
          user,
          password,
          database,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0,
          connectTimeout: 5000,
        });
        console.log(`✅ MySQL Pool created for ${user}@${host}:${port}/${database}`);
      } catch (err: any) {
        this.connectionError = err.message;
        console.warn('⚠️ Could not create MySQL pool:', err.message);
      }
    } else {
      this.connectionError = 'MySQL credentials missing or incomplete.';
      console.log('ℹ️ MySQL credentials missing or incomplete. Seamlessly using Node.js persistent DB engine.');
    }
  }

  // Setup MySQL Table Schema
  public async setupTables(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const conn = await Promise.race([
        this.pool.getConnection(),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('MySQL connection timeout (5s)')), 5000)
        )
      ]);
      
      // 1. Create Users Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(128) PRIMARY KEY,
          username VARCHAR(128) NOT NULL,
          email VARCHAR(256) NOT NULL,
          role VARCHAR(64) DEFAULT 'user',
          avatarUrl TEXT,
          dealsPosted INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 2. Create Deals Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS deals (
          id VARCHAR(128) PRIMARY KEY,
          title VARCHAR(512) NOT NULL,
          description TEXT,
          store VARCHAR(64) NOT NULL,
          category VARCHAR(128) NOT NULL,
          originalPrice DECIMAL(10, 2) NOT NULL,
          dealPrice DECIMAL(10, 2) NOT NULL,
          discountPercentage INT NOT NULL,
          couponCode VARCHAR(64),
          imageUrl TEXT,
          dealUrl TEXT NOT NULL,
          isLootDeal TINYINT(1) DEFAULT 0,
          isVerified TINYINT(1) DEFAULT 1,
          isActive TINYINT(1) DEFAULT 1,
          upvotes INT DEFAULT 0,
          downvotes INT DEFAULT 0,
          aiScore INT DEFAULT 85,
          aiVerdict TEXT,
          aiPros TEXT,
          aiCons TEXT,
          postedAt VARCHAR(64),
          postedBy VARCHAR(128),
          viewsCount INT DEFAULT 0,
          commentsCount INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 3. Create Link Clicks Tracking Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS link_clicks (
          id INT AUTO_INCREMENT PRIMARY KEY,
          deal_id VARCHAR(128) NOT NULL,
          deal_title VARCHAR(512),
          store VARCHAR(64),
          affiliate_url TEXT,
          user_id VARCHAR(128),
          ip_address VARCHAR(64),
          clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 4. Create Deal Views Tracking Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS deal_views (
          id INT AUTO_INCREMENT PRIMARY KEY,
          deal_id VARCHAR(128) NOT NULL,
          user_id VARCHAR(128),
          ip_address VARCHAR(64),
          viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 5. Create Affiliate Configs Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS affiliate_configs (
          store_key VARCHAR(64) PRIMARY KEY,
          store_name VARCHAR(64) NOT NULL,
          tag VARCHAR(128) NOT NULL,
          parameter_name VARCHAR(64) NOT NULL,
          is_active TINYINT(1) DEFAULT 1,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 6. Create Price History Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          deal_id VARCHAR(128) NOT NULL,
          date_label VARCHAR(64) NOT NULL,
          price DECIMAL(10, 2) NOT NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      conn.release();
      this.isInitialized = true;
      console.log('✅ MySQL schema & tables verified successfully');

      // Auto-migrate demo data & store configurations into MySQL
      this.syncAllDataToMySql().then((res) => {
        if (res.success) {
          console.log(`✅ Demo information automatically migrated into MySQL: ${res.migratedDealsCount} deals & ${res.migratedConfigsCount} store configs.`);
        }
      }).catch(err => {
        console.warn('⚠️ Demo data migration warning:', err.message);
      });

      return true;
    } catch (err: any) {
      this.connectionError = err.message;
      this.isInitialized = false;
      console.info('ℹ️ MySQL database connection notice:', err.message, '- Using Node.js persistent database fallback.');
      return false;
    }
  }

  // Get MySQL DB Connection Status
  public async getStatus(): Promise<MySqlStatus> {
    const configuredHost = process.env.MYSQL_HOST || process.env.DB_HOST || 'srv625.hstgr.io';
    const configuredDb = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'u179476470_dealdb';
    const configuredUser = process.env.MYSQL_USER || process.env.DB_USER || 'u179476470_dealusr';
    const configuredPort = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);

    if (!this.pool) {
      return {
        isConnected: false,
        engine: 'Node.js Express Persistent DB (MySQL Schema Emulated)',
        host: configuredHost,
        port: configuredPort,
        user: configuredUser,
        database: configuredDb,
        error: this.connectionError || 'No MySQL host configured in environment variables',
        tables: ['deals', 'affiliate_configs', 'price_history', 'comments']
      };
    }

    try {
      const conn = await this.pool.getConnection();
      const [rows]: any = await conn.query('SHOW TABLES');
      conn.release();

      const tableNames = Array.isArray(rows) 
        ? rows.map((r: any) => Object.values(r)[0] as string)
        : [];

      return {
        isConnected: true,
        engine: 'MySQL 8.0 / MariaDB Server',
        host: configuredHost,
        port: configuredPort,
        user: configuredUser,
        database: configuredDb,
        tables: tableNames
      };
    } catch (err: any) {
      return {
        isConnected: false,
        engine: 'MySQL Server (Connection Failed)',
        host: configuredHost,
        port: configuredPort,
        user: configuredUser,
        database: configuredDb,
        error: err.message,
        tables: ['deals', 'affiliate_configs', 'price_history', 'comments']
      };
    }
  }

  // Execute Direct SQL Query (For Admin or Custom DB Actions)
  public async executeSql(sql: string, params: any[] = []): Promise<any> {
    if (!this.pool) {
      throw new Error('MySQL connection pool not available. Check MYSQL_HOST or MYSQL_URI environment setup.');
    }
    const [results] = await this.pool.execute(sql, params);
    return results;
  }

  // Fetch all deals from MySQL or fallback
  public async getDeals(): Promise<Deal[]> {
    if (this.pool && this.isInitialized) {
      try {
        const [rows]: any = await this.pool.query('SELECT * FROM deals ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            store: r.store as StoreName,
            category: r.category,
            originalPrice: Number(r.originalPrice),
            dealPrice: Number(r.dealPrice),
            discountPercentage: Number(r.discountPercentage),
            couponCode: r.couponCode,
            imageUrl: r.imageUrl,
            dealUrl: r.dealUrl,
            isLootDeal: Boolean(r.isLootDeal),
            isVerified: Boolean(r.isVerified),
            isActive: r.isActive === null || r.isActive === undefined ? true : Boolean(r.isActive),
            upvotes: Number(r.upvotes || 0),
            downvotes: Number(r.downvotes || 0),
            aiScore: Number(r.aiScore || 85),
            aiVerdict: r.aiVerdict || '',
            aiPros: r.aiPros ? JSON.parse(r.aiPros) : ['Verified price savings', 'Great seller discount'],
            aiCons: r.aiCons ? JSON.parse(r.aiCons) : ['Limited time deal availability'],
            postedAt: r.postedAt || 'Recently',
            postedBy: r.postedBy || 'Community Member',
            viewsCount: Number(r.viewsCount || 0),
            commentsCount: Number(r.commentsCount || 0),
            priceHistory: [
              { date: 'Previous', price: Number(r.originalPrice) },
              { date: 'Today', price: Number(r.dealPrice) }
            ],
            comments: []
          }));
        }
      } catch (err) {
        console.warn('⚠️ MySQL query failed, using persistent DB fallback:', err);
      }
    }
    return dbManager.getDeals();
  }

  // Insert deal into MySQL & DB Manager
  public async addDeal(dealData: Partial<Deal>, allowDuplicate: boolean = false): Promise<Deal> {
    const newDeal = dbManager.addDeal(dealData, allowDuplicate);

    if (this.pool) {
      try {
        await this.pool.execute(
          `INSERT INTO deals (
            id, title, description, store, category, originalPrice, dealPrice, 
            discountPercentage, couponCode, imageUrl, dealUrl, isLootDeal, 
            isVerified, isActive, upvotes, downvotes, aiScore, aiVerdict, 
            postedAt, postedBy, viewsCount, commentsCount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newDeal.id,
            newDeal.title,
            newDeal.description || '',
            newDeal.store,
            newDeal.category,
            newDeal.originalPrice,
            newDeal.dealPrice,
            newDeal.discountPercentage,
            newDeal.couponCode || null,
            newDeal.imageUrl,
            newDeal.dealUrl,
            newDeal.isLootDeal ? 1 : 0,
            newDeal.isVerified ? 1 : 0,
            newDeal.isActive !== false ? 1 : 0,
            newDeal.upvotes,
            newDeal.downvotes,
            newDeal.aiScore,
            newDeal.aiVerdict || '',
            newDeal.postedAt,
            newDeal.postedBy,
            newDeal.viewsCount,
            newDeal.commentsCount
          ]
        );
        console.log(`✅ Deal ${newDeal.id} persisted to MySQL database`);
      } catch (err: any) {
        console.warn('⚠️ Could not insert deal into MySQL:', err.message);
      }
    }

    return newDeal;
  }

  // Update deal in MySQL & DB Manager
  public async updateDeal(id: string, updatedFields: Partial<Deal>): Promise<Deal | null> {
    const updated = dbManager.updateDeal(id, updatedFields);
    if (!updated) return null;

    if (this.pool) {
      try {
        await this.pool.execute(
          `UPDATE deals SET 
            title = ?, description = ?, store = ?, category = ?, 
            originalPrice = ?, dealPrice = ?, discountPercentage = ?, 
            couponCode = ?, imageUrl = ?, dealUrl = ?, isLootDeal = ?, 
            isVerified = ?, isActive = ?, aiScore = ?, aiVerdict = ?
          WHERE id = ?`,
          [
            updated.title,
            updated.description || '',
            updated.store,
            updated.category,
            updated.originalPrice,
            updated.dealPrice,
            updated.discountPercentage,
            updated.couponCode || null,
            updated.imageUrl,
            updated.dealUrl,
            updated.isLootDeal ? 1 : 0,
            updated.isVerified ? 1 : 0,
            updated.isActive !== false ? 1 : 0,
            updated.aiScore,
            updated.aiVerdict || '',
            id
          ]
        );
        console.log(`✅ Deal ${id} updated in MySQL database`);
      } catch (err: any) {
        console.warn('⚠️ Could not update deal in MySQL:', err.message);
      }
    }

    return updated;
  }

  // Delete deal from MySQL & DB Manager
  public async deleteDeal(id: string): Promise<boolean> {
    const deleted = dbManager.deleteDeal(id);

    if (this.pool) {
      try {
        await this.pool.execute('DELETE FROM deals WHERE id = ?', [id]);
        console.log(`✅ Deal ${id} deleted from MySQL database`);
      } catch (err: any) {
        console.warn('⚠️ Could not delete deal from MySQL:', err.message);
      }
    }

    return deleted;
  }

  // --- USERS MANAGEMENT ---
  public async getUsers(): Promise<UserRecord[]> {
    if (this.pool && this.isInitialized) {
      try {
        const [rows]: any = await this.pool.execute('SELECT * FROM users ORDER BY created_at DESC');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            username: r.username,
            email: r.email,
            role: r.role || 'user',
            avatarUrl: r.avatarUrl,
            dealsPosted: r.dealsPosted || 0,
            createdAt: r.created_at
          }));
        }
      } catch (err: any) {
        console.warn('⚠️ Could not fetch users from MySQL:', err.message);
      }
    }
    return dbManager.getUsers();
  }

  public async addUser(userData: Partial<UserRecord>): Promise<UserRecord> {
    const saved = dbManager.addUser(userData);
    if (this.pool) {
      try {
        await this.pool.execute(
          `INSERT INTO users (id, username, email, role, avatarUrl, dealsPosted)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE username=VALUES(username), avatarUrl=VALUES(avatarUrl), dealsPosted=VALUES(dealsPosted)`,
          [saved.id, saved.username, saved.email, saved.role, saved.avatarUrl, saved.dealsPosted]
        );
      } catch (err: any) {
        console.warn('⚠️ Could not insert user into MySQL:', err.message);
      }
    }
    return saved;
  }

  // --- LINK CLICKS MANAGEMENT ---
  public async recordLinkClick(clickData: {
    dealId: string;
    dealTitle?: string;
    store?: string;
    affiliateUrl?: string;
    userId?: string;
    ipAddress?: string;
  }): Promise<LinkClickRecord> {
    const click = dbManager.recordLinkClick(clickData);
    if (this.pool) {
      try {
        await this.pool.execute(
          `INSERT INTO link_clicks (deal_id, deal_title, store, affiliate_url, user_id, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [click.dealId, click.dealTitle, click.store, click.affiliateUrl, click.userId || 'user_anonymous', click.ipAddress || '127.0.0.1']
        );
      } catch (err: any) {
        console.warn('⚠️ Could not record link click in MySQL:', err.message);
      }
    }
    return click;
  }

  public async getLinkClicks(): Promise<LinkClickRecord[]> {
    if (this.pool && this.isInitialized) {
      try {
        const [rows]: any = await this.pool.execute('SELECT * FROM link_clicks ORDER BY clicked_at DESC LIMIT 100');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            dealId: r.deal_id,
            dealTitle: r.deal_title,
            store: r.store,
            affiliateUrl: r.affiliate_url,
            userId: r.user_id,
            ipAddress: r.ip_address,
            clickedAt: r.clicked_at
          }));
        }
      } catch (err: any) {
        console.warn('⚠️ Could not fetch link clicks from MySQL:', err.message);
      }
    }
    return dbManager.getLinkClicks();
  }

  // --- DEAL VIEWS MANAGEMENT ---
  public async recordDealView(viewData: {
    dealId: string;
    userId?: string;
    ipAddress?: string;
  }): Promise<DealViewRecord> {
    const view = dbManager.recordDealView(viewData);
    if (this.pool) {
      try {
        await this.pool.execute(
          `INSERT INTO deal_views (deal_id, user_id, ip_address) VALUES (?, ?, ?)`,
          [view.dealId, view.userId || 'user_anonymous', view.ipAddress || '127.0.0.1']
        );
        await this.pool.execute(
          `UPDATE deals SET viewsCount = viewsCount + 1 WHERE id = ?`,
          [view.dealId]
        );
      } catch (err: any) {
        console.warn('⚠️ Could not record deal view in MySQL:', err.message);
      }
    }
    return view;
  }

  public async getDealViews(): Promise<DealViewRecord[]> {
    if (this.pool && this.isInitialized) {
      try {
        const [rows]: any = await this.pool.execute('SELECT * FROM deal_views ORDER BY viewed_at DESC LIMIT 100');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map((r: any) => ({
            id: r.id,
            dealId: r.deal_id,
            userId: r.user_id,
            ipAddress: r.ip_address,
            viewedAt: r.viewed_at
          }));
        }
      } catch (err: any) {
        console.warn('⚠️ Could not fetch deal views from MySQL:', err.message);
      }
    }
    return dbManager.getDealViews();
  }

  // Migrate / Sync All Data (Users, Deals, Link Clicks, Deal Views, Affiliate Configs) into MySQL
  public async syncAllDataToMySql(): Promise<{
    success: boolean;
    migratedUsersCount: number;
    migratedDealsCount: number;
    migratedClicksCount: number;
    migratedViewsCount: number;
    migratedConfigsCount: number;
    engine: string;
    message: string;
  }> {
    const allUsers = dbManager.getUsers();
    const allDeals = dbManager.getDeals();
    const allClicks = dbManager.getLinkClicks();
    const allViews = dbManager.getDealViews();
    const configs = DEFAULT_AFFILIATE_CONFIGS;

    if (!this.pool) {
      return {
        success: false,
        migratedUsersCount: allUsers.length,
        migratedDealsCount: allDeals.length,
        migratedClicksCount: allClicks.length,
        migratedViewsCount: allViews.length,
        migratedConfigsCount: Object.keys(configs).length,
        engine: 'Node.js Express Persistent DB (Fallback Engine Active)',
        message: 'MySQL pool is offline. Successfully persisted all Users, Deals, Clicks, and Views into Node.js database fallback!'
      };
    }

    try {
      const isReady = await this.setupTables();
      if (!isReady) {
        return {
          success: false,
          migratedUsersCount: 0,
          migratedDealsCount: 0,
          migratedClicksCount: 0,
          migratedViewsCount: 0,
          migratedConfigsCount: 0,
          engine: 'MySQL Server',
          message: `Could not connect to MySQL server at srv625.hstgr.io. (${this.connectionError || 'Connection refused or access denied. Ensure Remote MySQL "%" is allowed in Hostinger cPanel.'})`
        };
      }

      // 1. Sync Users
      let usersSynced = 0;
      for (const u of allUsers) {
        await this.pool.execute(
          `INSERT INTO users (id, username, email, role, avatarUrl, dealsPosted)
           VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE username=VALUES(username), avatarUrl=VALUES(avatarUrl), dealsPosted=VALUES(dealsPosted)`,
          [u.id, u.username, u.email, u.role, u.avatarUrl, u.dealsPosted || 0]
        );
        usersSynced++;
      }

      // 2. Sync Deals
      let dealsSynced = 0;
      for (const deal of allDeals) {
        await this.pool.execute(
          `INSERT INTO deals (
            id, title, description, store, category, originalPrice, dealPrice, 
            discountPercentage, couponCode, imageUrl, dealUrl, isLootDeal, 
            isVerified, isActive, upvotes, downvotes, aiScore, aiVerdict, aiPros, aiCons,
            postedAt, postedBy, viewsCount, commentsCount
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE 
            title=VALUES(title), description=VALUES(description), store=VALUES(store),
            category=VALUES(category), originalPrice=VALUES(originalPrice), dealPrice=VALUES(dealPrice),
            discountPercentage=VALUES(discountPercentage), couponCode=VALUES(couponCode),
            imageUrl=VALUES(imageUrl), dealUrl=VALUES(dealUrl), isLootDeal=VALUES(isLootDeal),
            isVerified=VALUES(isVerified), isActive=VALUES(isActive), aiScore=VALUES(aiScore),
            aiVerdict=VALUES(aiVerdict), aiPros=VALUES(aiPros), aiCons=VALUES(aiCons)`,
          [
            deal.id,
            deal.title,
            deal.description || '',
            deal.store,
            deal.category,
            deal.originalPrice,
            deal.dealPrice,
            deal.discountPercentage,
            deal.couponCode || null,
            deal.imageUrl,
            deal.dealUrl,
            deal.isLootDeal ? 1 : 0,
            deal.isVerified ? 1 : 0,
            deal.isActive !== false ? 1 : 0,
            deal.upvotes || 0,
            deal.downvotes || 0,
            deal.aiScore || 85,
            deal.aiVerdict || '',
            JSON.stringify(deal.aiPros || []),
            JSON.stringify(deal.aiCons || []),
            deal.postedAt || 'Recently',
            deal.postedBy || 'Community Member',
            deal.viewsCount || 0,
            deal.commentsCount || 0
          ]
        );
        dealsSynced++;
      }

      // 3. Sync Link Clicks
      let clicksSynced = 0;
      for (const cl of allClicks) {
        await this.pool.execute(
          `INSERT INTO link_clicks (deal_id, deal_title, store, affiliate_url, user_id, ip_address)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [cl.dealId, cl.dealTitle, cl.store, cl.affiliateUrl, cl.userId || 'user_anonymous', cl.ipAddress || '127.0.0.1']
        );
        clicksSynced++;
      }

      // 4. Sync Deal Views
      let viewsSynced = 0;
      for (const vw of allViews) {
        await this.pool.execute(
          `INSERT INTO deal_views (deal_id, user_id, ip_address)
           VALUES (?, ?, ?)`,
          [vw.dealId, vw.userId || 'user_anonymous', vw.ipAddress || '127.0.0.1']
        );
        viewsSynced++;
      }

      // 5. Sync Affiliate Configs
      let configsSynced = 0;
      for (const [key, cfg] of Object.entries(configs)) {
        await this.pool.execute(
          `INSERT INTO affiliate_configs (store_key, store_name, tag, parameter_name, is_active)
           VALUES (?, ?, ?, ?, 1)
           ON DUPLICATE KEY UPDATE tag=VALUES(tag), parameter_name=VALUES(parameter_name)`,
          [key, cfg.store, cfg.tagValue, cfg.tagParam]
        );
        configsSynced++;
      }

      return {
        success: true,
        migratedUsersCount: usersSynced,
        migratedDealsCount: dealsSynced,
        migratedClicksCount: clicksSynced,
        migratedViewsCount: viewsSynced,
        migratedConfigsCount: configsSynced,
        engine: 'MySQL 8.0 / MariaDB Server',
        message: `Successfully migrated ${usersSynced} users, ${dealsSynced} deals, ${clicksSynced} link clicks, ${viewsSynced} deal views, and ${configsSynced} store configs to MySQL database!`
      };
    } catch (err: any) {
      console.error('Error migrating data to MySQL:', err);
      return {
        success: false,
        migratedUsersCount: 0,
        migratedDealsCount: 0,
        migratedClicksCount: 0,
        migratedViewsCount: 0,
        migratedConfigsCount: 0,
        engine: 'MySQL Database',
        message: `Migration failed: ${err.message}`
      };
    }
  }
}

export const mySqlDb = new MySqlDatabaseService();
