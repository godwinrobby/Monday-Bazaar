import mysql from 'mysql2/promise';
import { Deal, StoreName } from '../types';
import { StoreAffiliateConfig, DEFAULT_AFFILIATE_CONFIGS } from '../utils/affiliate';
import { dbManager } from './dbManager';

export interface MySqlStatus {
  isConnected: boolean;
  engine: string;
  host?: string;
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
    const host = process.env.MYSQL_HOST || process.env.DB_HOST;
    const user = process.env.MYSQL_USER || process.env.DB_USER;
    const password = process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || '';
    const database = process.env.MYSQL_DATABASE || process.env.DB_NAME || 'dealsified_db';
    const port = Number(process.env.MYSQL_PORT || process.env.DB_PORT || 3306);
    const mysqlUri = process.env.MYSQL_URI || process.env.DATABASE_URL;

    if (mysqlUri) {
      try {
        this.pool = mysql.createPool(mysqlUri);
        console.log('✅ MySQL Pool created via MYSQL_URI');
      } catch (err: any) {
        this.connectionError = err.message;
        console.warn('⚠️ Could not create MySQL pool via URI:', err.message);
      }
    } else if (host) {
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
        });
        console.log(`✅ MySQL Pool created for ${user}@${host}:${port}/${database}`);
      } catch (err: any) {
        this.connectionError = err.message;
        console.warn('⚠️ Could not create MySQL pool:', err.message);
      }
    } else {
      this.connectionError = 'MYSQL_HOST or MYSQL_URI environment variable not configured.';
      console.log('ℹ️ MySQL configuration missing. Operating with Node.js persistent DB engine with MySQL schema compatibility.');
    }
  }

  // Setup MySQL Table Schema
  public async setupTables(): Promise<boolean> {
    if (!this.pool) return false;

    try {
      const conn = await this.pool.getConnection();
      
      // 1. Create Deals Table
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
          postedAt VARCHAR(64),
          postedBy VARCHAR(128),
          viewsCount INT DEFAULT 0,
          commentsCount INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      // 2. Create Affiliate Configs Table
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

      // 3. Create Price History Table
      await conn.query(`
        CREATE TABLE IF NOT EXISTS price_history (
          id INT AUTO_INCREMENT PRIMARY KEY,
          deal_id VARCHAR(128) NOT NULL,
          date_label VARCHAR(64) NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
      `);

      conn.release();
      this.isInitialized = true;
      console.log('✅ MySQL schema & tables verified successfully');
      return true;
    } catch (err: any) {
      this.connectionError = err.message;
      console.error('❌ MySQL Table Setup Error:', err.message);
      return false;
    }
  }

  // Get MySQL DB Connection Status
  public async getStatus(): Promise<MySqlStatus> {
    if (!this.pool) {
      return {
        isConnected: false,
        engine: 'Node.js Express Persistent DB (MySQL Schema Emulated)',
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
        host: process.env.MYSQL_HOST || 'Connected via MYSQL_URI',
        database: process.env.MYSQL_DATABASE || 'dealsified_db',
        tables: tableNames
      };
    } catch (err: any) {
      return {
        isConnected: false,
        engine: 'MySQL Server (Connection Failed)',
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
  public async addDeal(dealData: Partial<Deal>): Promise<Deal> {
    const newDeal = dbManager.addDeal(dealData);

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
}

export const mySqlDb = new MySqlDatabaseService();
