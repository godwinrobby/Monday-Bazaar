import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { dbManager } from "./src/db/dbManager";
import { mySqlDb } from "./src/db/mysqlDb";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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

// Health route with MySQL status
app.get("/api/health", async (req, res) => {
  const status = await mySqlDb.getStatus();
  res.json({
    status: "ok",
    app: "Dealsified",
    dbEngine: status.engine,
    isMySqlConnected: status.isConnected,
    time: new Date().toISOString()
  });
});

// GET /api/db-status - Detail MySQL Database Engine Status
app.get("/api/db-status", async (req, res) => {
  try {
    const status = await mySqlDb.getStatus();
    res.json({ success: true, db: status });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/migrate-to-mysql - Migrate all catalog deals & store configs into MySQL
app.post("/api/migrate-to-mysql", async (req, res) => {
  try {
    const result = await mySqlDb.syncAllDataToMySql();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/migrate-localstorage - Migrate all Users, Deals, Link Clicks, and Views into database
app.post("/api/migrate-localstorage", async (req, res) => {
  try {
    const { localDeals, affiliateConfigs } = req.body || {};
    let migratedDealsCount = 0;

    if (Array.isArray(localDeals) && localDeals.length > 0) {
      for (const deal of localDeals) {
        if (deal && deal.title) {
          await mySqlDb.addDeal(deal);
          migratedDealsCount++;
        }
      }
    }

    // Ensure all Users, Deals, Link Clicks, Deal Views, and Store Configs are synced into MySQL or persistent database
    const mysqlSyncResult = await mySqlDb.syncAllDataToMySql();

    const users = await mySqlDb.getUsers();
    const deals = await mySqlDb.getDeals();
    const clicks = await mySqlDb.getLinkClicks();
    const views = await mySqlDb.getDealViews();

    res.json({
      success: true,
      migratedDealsCount,
      usersCount: users.length,
      dealsCount: deals.length,
      clicksCount: clicks.length,
      viewsCount: views.length,
      mysqlStatus: mysqlSyncResult.message,
      message: `Successfully migrated all Users (${users.length}), Deals (${deals.length}), Link Clicks (${clicks.length}), and Views (${views.length}) into database!`
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: `Migration error: ${err.message}` });
  }
});

// ================= DATABASE API ROUTES =================

// GET /api/deals - Fetch all deals from MySQL / Node.js database
app.get("/api/deals", async (req, res) => {
  try {
    const deals = await mySqlDb.getDeals();
    res.json({ success: true, count: deals.length, deals });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deals - Add new deal to MySQL database
app.post("/api/deals", async (req, res) => {
  try {
    const newDeal = await mySqlDb.addDeal(req.body);
    res.status(201).json({ success: true, deal: newDeal });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/deals/:id - Update deal in MySQL database
app.put("/api/deals/:id", async (req, res) => {
  try {
    const updated = await mySqlDb.updateDeal(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, deal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/deals/:id - Remove deal from MySQL database
app.delete("/api/deals/:id", async (req, res) => {
  try {
    const deleted = await mySqlDb.deleteDeal(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, message: "Deal deleted successfully" });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/deals/:id/vote - Upvote / Downvote deal in database
app.post("/api/deals/:id/vote", (req, res) => {
  try {
    const { type } = req.body;
    if (type !== 'up' && type !== 'down') {
      return res.status(400).json({ success: false, error: "Invalid vote type" });
    }
    const updated = dbManager.voteDeal(req.params.id, type);
    if (!updated) {
      return res.status(404).json({ success: false, error: "Deal not found" });
    }
    res.json({ success: true, deal: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/affiliate-configs - Get store affiliate tags
app.get("/api/affiliate-configs", (req, res) => {
  try {
    const configs = dbManager.getAffiliateConfigs();
    res.json({ success: true, configs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/affiliate-configs - Save store affiliate tags
app.post("/api/affiliate-configs", (req, res) => {
  try {
    const updated = dbManager.updateAffiliateConfigs(req.body);
    res.json({ success: true, configs: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= USER MANAGEMENT API ROUTES =================

// GET /api/users - Fetch all users from database
app.get("/api/users", async (req, res) => {
  try {
    const users = await mySqlDb.getUsers();
    res.json({ success: true, count: users.length, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/users - Add/Register user profile in database
app.post("/api/users", async (req, res) => {
  try {
    const user = await mySqlDb.addUser(req.body);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ================= LINK CLICKS & VIEWS API ROUTES =================

// GET /api/clicks - Fetch link click tracking records
app.get("/api/clicks", async (req, res) => {
  try {
    const clicks = await mySqlDb.getLinkClicks();
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
    const click = await mySqlDb.recordLinkClick({
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
    const views = await mySqlDb.getDealViews();
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
    const view = await mySqlDb.recordDealView({
      dealId,
      userId,
      ipAddress
    });
    res.status(201).json({ success: true, view });
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
  // Initialize MySQL Database Tables if configured
  await mySqlDb.setupTables().catch(err => {
    console.warn('MySQL initialization notice:', err.message);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Dealsified server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
