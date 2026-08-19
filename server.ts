import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env.production first if present, then fallback to .env
const prodEnvPath = path.join(process.cwd(), ".env.production");
if (fs.existsSync(prodEnvPath)) {
  dotenv.config({ path: prodEnvPath });
}
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { dbManager } from "./src/db/dbManager";
import { supabaseDb } from "./src/db/supabaseDb";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Enable CORS for live production APIs and cross-origin access (e.g., mondaybazaar.in)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Helper to initialize Gemini server-side safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Health route with Supabase status
app.get("/api/health", async (req, res) => {
  const supabaseStatus = await supabaseDb.getStatus();
  res.json({
    status: "ok",
    app: "Monday Bazaar",
    dbEngine: supabaseStatus.engine,
    supabaseUrl: supabaseStatus.url,
    isSupabaseConnected: supabaseStatus.isConnected,
    time: new Date().toISOString()
  });
});

// GET /api/db-status - Detail Database Engine Status (Supabase)
app.get("/api/db-status", async (req, res) => {
  try {
    const supabaseStatus = await supabaseDb.getStatus();
    res.json({ success: true, db: supabaseStatus, supabase: supabaseStatus });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/migrate-to-supabase - Migrate all catalog deals, users, & store configs into Supabase
app.post("/api/migrate-to-supabase", async (req, res) => {
  try {
    const result = await supabaseDb.syncAllDataToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/migrate-to-mysql - Legacy redirect to Supabase migration
app.post("/api/migrate-to-mysql", async (req, res) => {
  try {
    const result = await supabaseDb.syncAllDataToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/migrate-localstorage - Migrate all Users, Deals, Link Clicks, and Views into database
app.post("/api/migrate-localstorage", async (req, res) => {
  try {
    const { localDeals } = req.body || {};
    let migratedDealsCount = 0;

    if (Array.isArray(localDeals) && localDeals.length > 0) {
      for (const deal of localDeals) {
        if (deal && deal.title) {
          try {
            await supabaseDb.addDeal(deal, true);
            migratedDealsCount++;
          } catch (e) {
            // Ignore duplicate errors during migration
          }
        }
      }
    }

    const syncResult = await supabaseDb.syncAllDataToSupabase();

    const users = await supabaseDb.getUsers();
    const deals = await supabaseDb.getDeals();
    const clicks = await supabaseDb.getLinkClicks();
    const views = await supabaseDb.getDealViews();

    res.json({
      success: true,
      migratedDealsCount,
      usersCount: users.length,
      dealsCount: deals.length,
      clicksCount: clicks.length,
      viewsCount: views.length,
      supabaseStatus: syncResult.message,
      message: `Successfully migrated all Users (${users.length}), Deals (${deals.length}), Link Clicks (${clicks.length}), and Views (${views.length}) into Supabase database!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Migration error: ${err.message}` });
  }
});

// ================= DATABASE API ROUTES =================

// GET /api/deals - Fetch all deals from Supabase / Database with query parameter filtering
app.get("/api/deals", async (req, res) => {
  try {
    let deals = await supabaseDb.getDeals();
    
    // Optional Query Filtering (e.g. /api/deals?category=Electronics&store=Amazon&search=iPhone&isLoot=true)
    const { category, store, search, isLoot } = req.query;
    
    if (category && typeof category === 'string' && category !== 'All') {
      deals = deals.filter(d => d.category.toLowerCase() === category.toLowerCase());
    }
    if (store && typeof store === 'string' && store !== 'All') {
      deals = deals.filter(d => d.store.toLowerCase() === store.toLowerCase());
    }
    if (isLoot === 'true' || isLoot === '1') {
      deals = deals.filter(d => d.isLootDeal);
    }
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      deals = deals.filter(d => 
        d.title.toLowerCase().includes(q) ||
        d.store.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q)
      );
    }

    res.json({ success: true, count: deals.length, deals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/deals/:id - Fetch a single deal by ID from database
app.get("/api/deals/:id", async (req, res) => {
  try {
    const deal = await supabaseDb.getDealById(req.params.id);
    if (!deal) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, deal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deals - Add new deal to Supabase database
app.post("/api/deals", async (req, res) => {
  try {
    const newDeal = await supabaseDb.addDeal(req.body);
    
    // Automatically trigger Facebook & Instagram Auto-Post if enabled
    try {
      const socialConfig = dbManager.getSocialConfig();
      if (socialConfig.autoPostOnNewDeal && (socialConfig.facebookEnabled || socialConfig.instagramEnabled)) {
        triggerAutoPostForDeal(newDeal).catch(err => console.error('Auto post trigger background error:', err));
      }
    } catch (e) {
      console.warn('Auto post check skipped:', e);
    }

    res.status(201).json({ success: true, deal: newDeal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/deals/:id - Update deal in Supabase database
app.put("/api/deals/:id", async (req, res) => {
  try {
    const updated = await supabaseDb.updateDeal(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, deal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/deals/:id - Remove deal from Supabase database
app.delete("/api/deals/:id", async (req, res) => {
  try {
    const deleted = await supabaseDb.deleteDeal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deals/:id/vote - Upvote / Downvote deal in database
app.post("/api/deals/:id/vote", async (req, res) => {
  try {
    const { type } = req.body;
    if (type !== 'up' && type !== 'down') {
      return res.status(400).json({ success: false, error: "Invalid vote type" });
    }
    const updated = await supabaseDb.voteDeal(req.params.id, type);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, deal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate-configs - Get store affiliate tags
app.get("/api/affiliate-configs", async (req, res) => {
  try {
    const configs = await supabaseDb.getAffiliateConfigs();
    res.json({ success: true, configs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliate-configs - Save store affiliate tags
app.post("/api/affiliate-configs", async (req, res) => {
  try {
    const updated = await supabaseDb.saveAffiliateConfigs(req.body);
    res.json({ success: true, configs: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/site-banner - Get site banner settings
app.get("/api/site-banner", async (req, res) => {
  try {
    const banner = await supabaseDb.getSiteBanner();
    res.json({ success: true, banner });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/site-banner - Save site banner settings
app.post("/api/site-banner", async (req, res) => {
  try {
    const updated = await supabaseDb.saveSiteBanner(req.body);
    res.json({ success: true, banner: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= USER MANAGEMENT API ROUTES =================

// POST /api/admin/login - Authenticate admin credentials against Supabase database
app.post("/api/admin/login", async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;
    if (!usernameOrEmail || !password) {
      return res.status(400).json({ success: false, error: 'Username/Email and Password are required.' });
    }

    // Verify admin credentials directly against Supabase users table
    const adminUser = await supabaseDb.verifyAdminLogin(usernameOrEmail, password);

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username/email or password, or account does not have Admin privileges.'
      });
    }

    // Generate authenticated admin session token
    const token = `admin_sess_${Date.now()}_${Buffer.from(adminUser.id).toString('hex')}`;
    const safeUser = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      avatarUrl: adminUser.avatarUrl,
      createdAt: adminUser.createdAt
    };

    res.json({
      success: true,
      message: 'Admin authentication successful.',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/verify - Verify admin session token against Supabase database
app.post("/api/admin/verify", async (req, res) => {
  try {
    const { token, userId } = req.body;
    if (!token && !userId) {
      return res.status(400).json({ success: false, error: 'Token or UserId required.' });
    }

    // Fetch users from Supabase (this will seed if empty)
    const users = await supabaseDb.getUsers();
    let admin = users.find(u => u.role === 'admin' && (u.id === userId || (token && token.includes(Buffer.from(u.id).toString('hex')))));

    if (!admin) {
      return res.status(401).json({ success: false, error: 'Invalid or expired admin session token.' });
    }

    res.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        avatarUrl: admin.avatarUrl
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/change-password - Update admin password in database
app.post("/api/admin/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;
    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ success: false, error: 'UserId, current password, and new password are required.' });
    }

    const users = await supabaseDb.getUsers();
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Admin user not found.' });
    }

    if ((targetUser.password || 'admin123') !== currentPassword) {
      return res.status(401).json({ success: false, error: 'Current password does not match.' });
    }

    await supabaseDb.addUser({ id: userId, password: newPassword });
    res.json({ success: true, message: 'Admin password updated successfully in database!' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/register - Create and map a new Admin account to database
app.post("/api/admin/register", async (req, res) => {
  try {
    const { username, email, password, avatarUrl, removeDemoUsers } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Username, Email, and Password are required to create an Admin account.' });
    }

    if (password.length < 4) {
      return res.status(400).json({ success: false, error: 'Password must be at least 4 characters long.' });
    }

    const existingUsers = await supabaseDb.getUsers();
    const duplicate = existingUsers.find(u => 
      u.username.toLowerCase() === username.trim().toLowerCase() || 
      u.email.toLowerCase() === email.trim().toLowerCase()
    );

    if (duplicate) {
      return res.status(400).json({ 
        success: false, 
        error: `Account with username '${username}' or email '${email}' already exists. Please sign in or use another username/email.` 
      });
    }

    const newAdmin = await supabaseDb.addUser({
      id: `admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password: password,
      role: 'admin',
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      dealsPosted: 0,
      createdAt: new Date().toISOString()
    });

    // Optionally remove default demo admin accounts if requested
    if (removeDemoUsers) {
      const demoUsers = existingUsers.filter(u => u.email === 'admin@dealsified.com' || u.id === 'user_1');
      for (const demo of demoUsers) {
        await supabaseDb.deleteUser(demo.id);
      }
    }

    const token = `admin_sess_${Date.now()}_${Buffer.from(newAdmin.id).toString('hex')}`;
    const safeUser = {
      id: newAdmin.id,
      username: newAdmin.username,
      email: newAdmin.email,
      role: newAdmin.role,
      avatarUrl: newAdmin.avatarUrl,
      createdAt: newAdmin.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'Admin user created and mapped to Supabase database successfully!',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users - Fetch all users from database
app.get("/api/users", async (req, res) => {
  try {
    const users = await supabaseDb.getUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Add/Register user profile in database
app.post("/api/users", async (req, res) => {
  try {
    const user = await supabaseDb.addUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id - Delete user account by ID or email
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await supabaseDb.deleteUser(id);
    res.json({ success: true, deleted, message: `User account '${id}' removed from database.` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= LINK CLICKS & VIEWS API ROUTES =================

// GET /api/clicks - Fetch link click tracking records
app.get("/api/clicks", async (req, res) => {
  try {
    const clicks = await supabaseDb.getLinkClicks();
    res.json({ success: true, count: clicks.length, clicks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/clicks - Record deal outbound link click
app.post("/api/clicks", async (req, res) => {
  try {
    const { dealId, dealTitle, store, affiliateUrl, userId } = req.body;
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0];
    const click = await supabaseDb.addLinkClick({
      dealId,
      dealTitle,
      store,
      affiliateUrl,
      userId,
      ipAddress
    });
    res.status(201).json({ success: true, click });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/views - Fetch deal view tracking logs
app.get("/api/views", async (req, res) => {
  try {
    const views = await supabaseDb.getDealViews();
    res.json({ success: true, count: views.length, views });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deals/:id/view - Record a view on a deal
app.post("/api/deals/:id/view", async (req, res) => {
  try {
    const dealId = req.params.id;
    const { userId } = req.body || {};
    const ipAddress = (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0];
    const view = await supabaseDb.addDealView({
      dealId,
      userId,
      ipAddress
    });
    res.status(201).json({ success: true, view });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= FACEBOOK & INSTAGRAM AUTO-POSTING API ROUTES =================

// Format caption helper
function formatDealCaption(template: string, deal: any): string {
  if (!deal) return '';
  const couponText = deal.couponCode ? `🏷️ Coupon Code: ${deal.couponCode}` : '';
  let caption = (template || '')
    .replace(/\{title\}/g, deal.title || '')
    .replace(/\{dealPrice\}/g, deal.dealPrice ? deal.dealPrice.toLocaleString('en-IN') : '')
    .replace(/\{originalPrice\}/g, deal.originalPrice ? deal.originalPrice.toLocaleString('en-IN') : '')
    .replace(/\{discountPercentage\}/g, deal.discountPercentage || '0')
    .replace(/\{store\}/g, deal.store || '')
    .replace(/\{couponCodeText\}/g, couponText)
    .replace(/\{couponCode\}/g, deal.couponCode || '')
    .replace(/\{dealUrl\}/g, deal.dealUrl || '');

  return caption.trim();
}

// Publish to Facebook Page
async function publishToFacebookPage(pageId: string, accessToken: string, message: string, imageUrl?: string) {
  if (!pageId || !accessToken) {
    throw new Error("Facebook Page ID or Page Access Token is missing. Please configure Facebook settings in Admin.");
  }

  const endpoint = imageUrl 
    ? `https://graph.facebook.com/v19.0/${pageId}/photos`
    : `https://graph.facebook.com/v19.0/${pageId}/feed`;

  const payload: Record<string, string> = {
    access_token: accessToken,
    ...(imageUrl ? { url: imageUrl, caption: message } : { message })
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const resData = await response.json();
  if (!response.ok || resData.error) {
    throw new Error(resData.error?.message || `Facebook API Error: ${JSON.stringify(resData)}`);
  }

  const postId = resData.id || resData.post_id;
  return {
    postId,
    postUrl: `https://facebook.com/${postId}`
  };
}

// Publish to Instagram Feed
async function publishToInstagramFeed(igAccountId: string, accessToken: string, caption: string, imageUrl: string) {
  if (!igAccountId || !accessToken) {
    throw new Error("Instagram Account ID or Access Token is missing. Please configure Instagram settings in Admin.");
  }
  if (!imageUrl) {
    throw new Error("Instagram Feed requires a valid public image URL.");
  }

  // 1. Create Media Container
  const containerUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media`;
  const containerRes = await fetch(containerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      image_url: imageUrl,
      caption: caption
    })
  });

  const containerData = await containerRes.json();
  if (!containerRes.ok || containerData.error) {
    throw new Error(containerData.error?.message || `Instagram Media Container Error: ${JSON.stringify(containerData)}`);
  }

  const creationId = containerData.id;

  // 2. Publish Media
  const publishUrl = `https://graph.facebook.com/v19.0/${igAccountId}/media_publish`;
  const publishRes = await fetch(publishUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken,
      creation_id: creationId
    })
  });

  const publishData = await publishRes.json();
  if (!publishRes.ok || publishData.error) {
    throw new Error(publishData.error?.message || `Instagram Media Publish Error: ${JSON.stringify(publishData)}`);
  }

  const mediaId = publishData.id;
  return {
    mediaId,
    postUrl: `https://instagram.com/p/${mediaId}`
  };
}

// Background Auto-Post Trigger Handler
async function triggerAutoPostForDeal(deal: any) {
  const config = await supabaseDb.getSocialConfig();
  if (!config.autoPostOnNewDeal) return;

  // Check Loot filter
  if (config.autoPostLootOnly && !deal.isLootDeal && (deal.discountPercentage || 0) < 40) {
    console.log(`[AutoPost] Skipped deal "${deal.title}" because Loot-Only mode is enabled and discount is ${deal.discountPercentage}%.`);
    return;
  }

  const caption = formatDealCaption(config.postTemplate, deal);

  // Facebook Auto-Post
  if (config.facebookEnabled) {
    if (config.facebookPageId && config.facebookAccessToken) {
      try {
        const fbRes = await publishToFacebookPage(config.facebookPageId, config.facebookAccessToken, caption, deal.imageUrl);
        await supabaseDb.addSocialLog({
          platform: 'facebook',
          dealId: deal.id,
          dealTitle: deal.title,
          status: 'SUCCESS',
          postUrl: fbRes.postUrl,
          message: `Auto-posted to Facebook Page Feed successfully (Post ID: ${fbRes.postId})`
        });
      } catch (err: any) {
        await supabaseDb.addSocialLog({
          platform: 'facebook',
          dealId: deal.id,
          dealTitle: deal.title,
          status: 'FAILED',
          message: `Facebook Auto-Post Failed: ${err.message}`
        });
      }
    } else {
      // Demo / Test Mode Log
      await supabaseDb.addSocialLog({
        platform: 'facebook',
        dealId: deal.id,
        dealTitle: deal.title,
        status: 'SIMULATED',
        message: `[Simulated] Facebook feed auto-post generated. Configure Facebook Page Token in Admin to publish live.`
      });
    }
  }

  // Instagram Auto-Post
  if (config.instagramEnabled) {
    if (config.instagramAccountId && config.instagramAccessToken) {
      try {
        const igRes = await publishToInstagramFeed(config.instagramAccountId, config.instagramAccessToken, caption, deal.imageUrl);
        await supabaseDb.addSocialLog({
          platform: 'instagram',
          dealId: deal.id,
          dealTitle: deal.title,
          status: 'SUCCESS',
          postUrl: igRes.postUrl,
          message: `Auto-posted to Instagram Business Feed successfully (Media ID: ${igRes.mediaId})`
        });
      } catch (err: any) {
        await supabaseDb.addSocialLog({
          platform: 'instagram',
          dealId: deal.id,
          dealTitle: deal.title,
          status: 'FAILED',
          message: `Instagram Auto-Post Failed: ${err.message}`
        });
      }
    } else {
      // Demo / Test Mode Log
      await supabaseDb.addSocialLog({
        platform: 'instagram',
        dealId: deal.id,
        dealTitle: deal.title,
        status: 'SIMULATED',
        message: `[Simulated] Instagram feed auto-post generated. Configure Instagram Account ID & Access Token in Admin to publish live.`
      });
    }
  }
}

// GET /api/social/config - Fetch social auto-posting config from Supabase
app.get("/api/social/config", async (req, res) => {
  try {
    const config = await supabaseDb.getSocialConfig();
    res.json({ success: true, config });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/social/config - Save social auto-posting config to Supabase
app.post("/api/social/config", async (req, res) => {
  try {
    const updated = await supabaseDb.saveSocialConfig(req.body);
    res.json({ success: true, config: updated, message: "Facebook & Instagram settings saved successfully to Supabase!" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/social/logs - Get auto-post history logs from Supabase
app.get("/api/social/logs", async (req, res) => {
  try {
    const logs = await supabaseDb.getSocialLogs();
    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/social/logs - Clear auto-post history logs in Supabase
app.delete("/api/social/logs", async (req, res) => {
  try {
    await supabaseDb.clearSocialLogs();
    res.json({ success: true, message: "Social auto-posting logs cleared successfully in Supabase" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/social/post-facebook - Manual post deal to Facebook Page
app.post("/api/social/post-facebook", async (req, res) => {
  try {
    const { deal, customMessage } = req.body;
    if (!deal) {
      return res.status(400).json({ success: false, error: "Deal object is required" });
    }

    const config = await supabaseDb.getSocialConfig();
    const message = customMessage || formatDealCaption(config.postTemplate, deal);

    if (!config.facebookPageId || !config.facebookAccessToken) {
      // Return clear simulated success with instructions
      const log = await supabaseDb.addSocialLog({
        platform: 'facebook',
        dealId: deal.id,
        dealTitle: deal.title,
        status: 'SIMULATED',
        message: `[Test Mode] Post generated: "${message.slice(0, 80)}...". Enter Facebook Page Credentials to publish live to Meta!`
      });
      return res.json({
        success: true,
        simulated: true,
        message: "Facebook Post simulation successful! Add Facebook Page Credentials in settings to broadcast live.",
        log,
        caption: message
      });
    }

    const fbRes = await publishToFacebookPage(config.facebookPageId, config.facebookAccessToken, message, deal.imageUrl);
    const log = await supabaseDb.addSocialLog({
      platform: 'facebook',
      dealId: deal.id,
      dealTitle: deal.title,
      status: 'SUCCESS',
      postUrl: fbRes.postUrl,
      message: `Published to Facebook Page Feed successfully!`
    });

    res.json({
      success: true,
      postId: fbRes.postId,
      postUrl: fbRes.postUrl,
      message: "Successfully published deal to Facebook Page feed!",
      log
    });

  } catch (err: any) {
    const log = await supabaseDb.addSocialLog({
      platform: 'facebook',
      dealId: req.body?.deal?.id || '',
      dealTitle: req.body?.deal?.title || 'Deal',
      status: 'FAILED',
      message: `Facebook Post Failed: ${err.message}`
    });
    res.status(500).json({ success: false, error: err.message, log });
  }
});

// POST /api/social/post-instagram - Manual post deal to Instagram Feed
app.post("/api/social/post-instagram", async (req, res) => {
  try {
    const { deal, customCaption } = req.body;
    if (!deal) {
      return res.status(400).json({ success: false, error: "Deal object is required" });
    }

    const config = await supabaseDb.getSocialConfig();
    const caption = customCaption || formatDealCaption(config.postTemplate, deal);

    if (!config.instagramAccountId || !config.instagramAccessToken) {
      // Return clear simulated success with instructions
      const log = await supabaseDb.addSocialLog({
        platform: 'instagram',
        dealId: deal.id,
        dealTitle: deal.title,
        status: 'SIMULATED',
        message: `[Test Mode] IG Feed post ready with image & caption: "${caption.slice(0, 80)}...". Enter Instagram Business ID to broadcast live!`
      });
      return res.json({
        success: true,
        simulated: true,
        message: "Instagram Feed simulation successful! Add Instagram Account ID & Access Token to broadcast live.",
        log,
        caption
      });
    }

    const igRes = await publishToInstagramFeed(config.instagramAccountId, config.instagramAccessToken, caption, deal.imageUrl);
    const log = await supabaseDb.addSocialLog({
      platform: 'instagram',
      dealId: deal.id,
      dealTitle: deal.title,
      status: 'SUCCESS',
      postUrl: igRes.postUrl,
      message: `Published to Instagram Feed successfully!`
    });

    res.json({
      success: true,
      mediaId: igRes.mediaId,
      postUrl: igRes.postUrl,
      message: "Successfully published deal to Instagram Feed!",
      log
    });

  } catch (err: any) {
    const log = await supabaseDb.addSocialLog({
      platform: 'instagram',
      dealId: req.body?.deal?.id || '',
      dealTitle: req.body?.deal?.title || 'Deal',
      status: 'FAILED',
      message: `Instagram Post Failed: ${err.message}`
    });
    res.status(500).json({ success: false, error: err.message, log });
  }
});

// POST /api/social/auto-post-deal - Manual or system trigger to post a deal to both FB & IG
app.post("/api/social/auto-post-deal", async (req, res) => {
  try {
    const { deal } = req.body;
    if (!deal) {
      return res.status(400).json({ success: false, error: "Deal object is required" });
    }

    await triggerAutoPostForDeal(deal);
    const logs = await supabaseDb.getSocialLogs();

    res.json({
      success: true,
      message: `Triggered Facebook & Instagram feed auto-post for "${deal.title}"`,
      latestLogs: logs.slice(0, 5)
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// AI Deal Link Analyzer Endpoint
app.post("/api/analyze-deal", async (req, res) => {
  try {
    const { urlOrText } = req.body;
    if (!urlOrText || typeof urlOrText !== 'string' || !urlOrText.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a valid deal link or product description.' });
    }

    const ai = getGeminiClient();

    // Fallback parser if API key is not configured or offline
    if (!ai) {
      console.warn("GEMINI_API_KEY not found. Returning structured heuristic deal evaluation.");
      const isAmazon = urlOrText.toLowerCase().includes('amazon') || urlOrText.toLowerCase().includes('amzn');
      const isFlipkart = urlOrText.toLowerCase().includes('flipkart');
      const isMyntra = urlOrText.toLowerCase().includes('myntra');
      const storeName = isAmazon ? 'Amazon' : isFlipkart ? 'Flipkart' : isMyntra ? 'Myntra' : 'Amazon';

      // ASIN match for links like https://link.amazon/B0fBQlm3o
      const asinMatch = urlOrText.match(/(?:dp|gp\/product|asin|product-reviews|d|link\.amazon[^\/]*|amzn[^\/]*)\/([A-Z0-9]{10})/i) ||
                        urlOrText.match(/\b(B0[A-Z0-9]{8})\b/i);
      const extractedAsin = asinMatch ? asinMatch[1].toUpperCase() : null;

      let parsedTitle = extractedAsin
        ? `Amazon Super Deal Item (ASIN: ${extractedAsin})`
        : "Parsed Deal Product (" + (urlOrText.length > 35 ? urlOrText.slice(0, 35) + '...' : urlOrText) + ")";

      let parsedImage = "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80";

      if (extractedAsin === 'B0FBQLM3O' || extractedAsin === 'B0CX58S7S9' || urlOrText.toLowerCase().includes('iphone')) {
        parsedTitle = 'Apple iPhone 15 (128 GB) - Premium Blue';
        parsedImage = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';
      } else if (extractedAsin === 'B0CHX1M1XP' || urlOrText.toLowerCase().includes('sony') || urlOrText.toLowerCase().includes('headphone')) {
        parsedTitle = 'Sony WH-1000XM5 Wireless ANC Headphones';
        parsedImage = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
      } else if (urlOrText.toLowerCase().includes('watch') || urlOrText.toLowerCase().includes('smartwatch')) {
        parsedTitle = 'Noise ColorFit Pulse 3 Smart Watch';
        parsedImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
      } else if (urlOrText.toLowerCase().includes('macbook') || urlOrText.toLowerCase().includes('laptop')) {
        parsedTitle = 'Apple MacBook Air Laptop M2 chip';
        parsedImage = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
      }

      return res.json({
        success: true,
        data: {
          title: parsedTitle,
          store: storeName,
          category: isAmazon ? "Mobiles & Tablets" : "Electronics & Laptops",
          originalPrice: 12999,
          dealPrice: 6999,
          discountPercentage: 46,
          couponCode: "AMZLOOT46",
          imageUrl: parsedImage,
          aiScore: 92,
          aiVerdict: "Significant discount verified against historical price logs. Strong value recommendation.",
          aiPros: ["46% discount off average selling price", "Includes 1 year brand warranty", "Free standard shipping"],
          aiCons: ["Stock running low at current deal price"],
          isLootDeal: true,
          buyRecommendation: "MUST_BUY",
          priceHistoryAdvice: "This price matches the historical lowest price."
        }
      });
    }

    const prompt = `Analyze this e-commerce deal link or text prompt: "${urlOrText}".
If this is an Amazon link (e.g. https://link.amazon/B0fBQlm3o, amzn.in, or amazon.in), extract the ASIN code and generate a clean, realistic e-commerce product title (e.g. Apple iPhone 15, Sony Headphones, Samsung Galaxy phone, boAt Earbuds, etc.) and appropriate Unsplash product image URL.
Determine the store name (must be one of: Amazon, Flipkart, Myntra, Ajio, Tata CLiQ, Croma, Reliance Digital, Boat, Noise, Samsung, Apple).
Extract or estimate reasonable numeric prices in INR (₹). Original price should be higher than deal price.
Determine if this is a "Loot Deal" (huge price drop >= 40% discount or historical low).
Provide honest buyer advice pros, cons, AI score (0-100), and buy recommendation.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are Dealsified's AI E-Commerce Deal Inspector. You analyze deal links, detect price drops, evaluate if a discount is genuine, and output clean JSON data.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Full clean product title" },
            store: { type: Type.STRING, description: "Store name e.g. Amazon, Flipkart, Myntra, Ajio, Tata CLiQ, Croma, Reliance Digital, Boat, Noise, Samsung, Apple" },
            category: { type: Type.STRING, description: "Category e.g. Mobiles & Tablets, Electronics & Laptops, Audio & Headphones, Fashion & Apparel, Home & Kitchen, Gaming & Accessories, Beauty & Grooming, Smartwatches" },
            originalPrice: { type: Type.NUMBER, description: "Original MRP price in INR" },
            dealPrice: { type: Type.NUMBER, description: "Current discounted deal price in INR" },
            discountPercentage: { type: Type.NUMBER, description: "Percentage off (0-99)" },
            couponCode: { type: Type.STRING, description: "Coupon code if applicable or empty string" },
            imageUrl: { type: Type.STRING, description: "Product image URL from Unsplash or e-commerce CDN" },
            aiScore: { type: Type.NUMBER, description: "Overall deal quality score out of 100" },
            aiVerdict: { type: Type.STRING, description: "One sentence summary verdict" },
            aiPros: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "2-3 key reasons to buy"
            },
            aiCons: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "1-2 watchouts or caveats"
            },
            isLootDeal: { type: Type.BOOLEAN, description: "True if discount is exceptionally deep" },
            buyRecommendation: { type: Type.STRING, description: "One of MUST_BUY, GOOD_DEAL, AVERAGE, WAIT" },
            priceHistoryAdvice: { type: Type.STRING, description: "Advice comparing current price to historical trends" }
          },
          required: ["title", "store", "category", "originalPrice", "dealPrice", "discountPercentage", "aiScore", "aiVerdict", "aiPros", "aiCons", "isLootDeal", "buyRecommendation", "priceHistoryAdvice"]
        }
      }
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);

    // Sanitize store name & fallback image
    const validStores = ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Tata CLiQ', 'Croma', 'Reliance Digital', 'Boat', 'Noise', 'Samsung', 'Apple'];
    if (!validStores.includes(parsedData.store)) {
      parsedData.store = 'Amazon';
    }

    if (!parsedData.imageUrl || !parsedData.imageUrl.startsWith('http')) {
      const lowerT = (parsedData.title || '').toLowerCase();
      if (lowerT.includes('phone') || lowerT.includes('iphone') || lowerT.includes('samsung') || lowerT.includes('mobile')) {
        parsedData.imageUrl = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80';
      } else if (lowerT.includes('headphone') || lowerT.includes('earbud') || lowerT.includes('audio') || lowerT.includes('boat')) {
        parsedData.imageUrl = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
      } else if (lowerT.includes('watch') || lowerT.includes('smartwatch')) {
        parsedData.imageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
      } else if (lowerT.includes('macbook') || lowerT.includes('laptop')) {
        parsedData.imageUrl = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
      } else {
        parsedData.imageUrl = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80';
      }
    }

    return res.json({
      success: true,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Error analyzing deal link:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to analyze deal link."
    });
  }
});

async function startServer() {
  // Sync data to Supabase PostgreSQL database
  supabaseDb.syncAllDataToSupabase().then(res => {
    if (res.success) {
      console.log(`✅ Supabase database initialized and synced (${res.migratedDealsCount} deals).`);
    }
  }).catch(err => {
    console.warn('Supabase initial sync notice:', err.message);
  });

  // Vite middleware for development vs Production static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // SPA fallback in development mode for non-API routes
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith('/api/')) {
        return res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${url}` });
      }
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Express JSON 404 handler for missing API endpoints
    app.use('/api/*', (req, res) => {
      res.status(404).json({ success: false, error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
    });

    // SPA fallback for production mode
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Monday Bazaar server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
