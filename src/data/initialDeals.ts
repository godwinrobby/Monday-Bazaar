import { Deal, StoreInfo, StoreName } from '../types';

export const STORES_INFO: Record<StoreName, StoreInfo> = {
  Amazon: {
    name: 'Amazon',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-400',
    accentColor: '#FF9900',
    dealsCount: 42,
  },
  Flipkart: {
    name: 'Flipkart',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-400',
    accentColor: '#2874F0',
    dealsCount: 38,
  },
  Myntra: {
    name: 'Myntra',
    badgeBg: 'bg-pink-100 text-pink-900 border-pink-300',
    badgeText: 'text-pink-700',
    borderColor: 'border-pink-400',
    accentColor: '#E40046',
    dealsCount: 24,
  },
  Ajio: {
    name: 'Ajio',
    badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-400',
    accentColor: '#2C4152',
    dealsCount: 19,
  },
  'Tata CLiQ': {
    name: 'Tata CLiQ',
    badgeBg: 'bg-red-100 text-red-900 border-red-300',
    badgeText: 'text-red-700',
    borderColor: 'border-red-400',
    accentColor: '#DA251C',
    dealsCount: 15,
  },
  Croma: {
    name: 'Croma',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-400',
    accentColor: '#00B894',
    dealsCount: 18,
  },
  'Reliance Digital': {
    name: 'Reliance Digital',
    badgeBg: 'bg-red-50 text-red-800 border-red-200',
    badgeText: 'text-red-700',
    borderColor: 'border-red-300',
    accentColor: '#E21B23',
    dealsCount: 14,
  },
  Boat: {
    name: 'Boat',
    badgeBg: 'bg-red-100 text-red-900 border-red-300',
    badgeText: 'text-red-600',
    borderColor: 'border-red-400',
    accentColor: '#EA1D25',
    dealsCount: 12,
  },
  Noise: {
    name: 'Noise',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-400',
    accentColor: '#4F46E5',
    dealsCount: 11,
  },
  Samsung: {
    name: 'Samsung',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-400',
    accentColor: '#1428A0',
    dealsCount: 16,
  },
  Apple: {
    name: 'Apple',
    badgeBg: 'bg-gray-100 text-gray-900 border-gray-300',
    badgeText: 'text-gray-800',
    borderColor: 'border-gray-400',
    accentColor: '#000000',
    dealsCount: 10,
  }
};

export const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    title: 'Apple iPhone 15 (128GB) - Black',
    description: 'Dynamic Island, 48MP Main Camera with 2X Telephoto, All-Day Battery Life, USB-C Connectivity. Lowest price in 6 months!',
    store: 'Flipkart',
    category: 'Mobiles & Tablets',
    originalPrice: 79900,
    dealPrice: 57999,
    discountPercentage: 27,
    couponCode: 'BANK1000OFF',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.flipkart.com/apple-iphone-15-black-128-gb/p/itm6ac6485515ae4',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 412,
    downvotes: 14,
    aiScore: 96,
    aiVerdict: 'Rare 27% price collapse on flagship iPhone 15. Historical lowest recorded price with additional HDFC card discount.',
    aiPros: [
      'Historical all-time low price point (₹57,999)',
      'Extra ₹1,000 instant bank discount applies',
      'High resale value and A16 Bionic chip performance'
    ],
    aiCons: [
      'Standard 60Hz display refresh rate',
      'Stocks selling out fast in Black variant'
    ],
    postedAt: '10 mins ago',
    expiryDate: 'Ends tonight at 11:59 PM',
    priceHistory: [
      { date: 'Jul 1', price: 72900 },
      { date: 'Jul 15', price: 68900 },
      { date: 'Jul 28', price: 64999 },
      { date: 'Aug 5', price: 57999 }
    ],
    commentsCount: 38,
    comments: [
      {
        id: 'c1',
        userName: 'TechHunter_99',
        text: 'Just ordered with SBI Credit Card, got it for net ₹56,999! Absolute steal loot deal!',
        timestamp: '5 mins ago',
        upvotes: 24
      },
      {
        id: 'c2',
        userName: 'RohanSharma',
        text: 'Will price drop further during Big Billion Days?',
        timestamp: '2 mins ago',
        upvotes: 3
      }
    ],
    viewsCount: 3420,
    postedBy: 'DealMaster_AI'
  },
  {
    id: 'deal-2',
    title: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    description: 'Industry-Leading Noise Cancellation, 30-Hour Battery, Ultra Comfortable Lightweight Design, Crystal Clear Hands-Free Calling.',
    store: 'Amazon',
    category: 'Audio & Headphones',
    originalPrice: 34990,
    dealPrice: 22990,
    discountPercentage: 34,
    couponCode: 'SONY2000',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.amazon.in/dp/B09XS7JWHH',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: true,
    upvotes: 289,
    downvotes: 8,
    aiScore: 92,
    aiVerdict: 'Top-tier ANC headphones dropping ₹12,000 off original MRP. Highly recommended audiophile offer.',
    aiPros: [
      'Best-in-class active noise cancellation',
      'Flat ₹12,000 flat drop from launch MRP',
      'Includes 6-month free Amazon Music subscription'
    ],
    aiCons: [
      'Non-foldable headband design compared to XM4'
    ],
    postedAt: '25 mins ago',
    expiryDate: 'Limited stock flash deal',
    priceHistory: [
      { date: 'Jul 1', price: 29990 },
      { date: 'Jul 15', price: 28490 },
      { date: 'Jul 28', price: 26990 },
      { date: 'Aug 5', price: 22990 }
    ],
    commentsCount: 19,
    comments: [
      {
        id: 'c3',
        userName: 'AudioGeek',
        text: 'Applied the coupon SONY2000 + Amazon Pay ICICI card 5% cashback. Effective price ₹20,890!',
        timestamp: '18 mins ago',
        upvotes: 18
      }
    ],
    viewsCount: 2150,
    postedBy: 'AudioFreak'
  },
  {
    id: 'deal-3',
    title: 'Samsung Galaxy Watch6 Bluetooth (44mm, Graphite)',
    description: 'Personalized HR Zone, Advanced Sleep Coaching, Sapphire Crystal Glass, BIA Body Composition Sensor.',
    store: 'Samsung',
    category: 'Smartwatches',
    originalPrice: 33999,
    dealPrice: 14999,
    discountPercentage: 56,
    couponCode: 'SAMSUNGWATCH',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.samsung.com/in/watches/galaxy-watch/galaxy-watch6-44mm-graphite-bluetooth-sm-r940nzkains/',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 530,
    downvotes: 11,
    aiScore: 98,
    aiVerdict: 'Unbelievable 56% discount directly on official Samsung corporate portal. Premium WearOS smartwatch at budget price.',
    aiPros: [
      '56% discount gives unbeatable value under 15k',
      'Full ECG, Blood Pressure & WearOS app ecosystem',
      'Sapphire crystal glass screen durability'
    ],
    aiCons: [
      'Best features require Samsung Galaxy phone pairing'
    ],
    postedAt: '1 hour ago',
    priceHistory: [
      { date: 'Jul 1', price: 26999 },
      { date: 'Jul 15', price: 22999 },
      { date: 'Jul 28', price: 18999 },
      { date: 'Aug 5', price: 14999 }
    ],
    commentsCount: 42,
    comments: [],
    viewsCount: 4890,
    postedBy: 'LootMaster'
  },
  {
    id: 'deal-4',
    title: 'ASUS TUF Gaming A15, AMD Ryzen 7 7435HS, RTX 3050 (16GB RAM / 512GB SSD)',
    description: '15.6" FHD 144Hz IPS display, 4GB NVIDIA GeForce RTX 3050, RGB Backlit Keyboard, Windows 11 Home.',
    store: 'Amazon',
    category: 'Electronics & Laptops',
    originalPrice: 78990,
    dealPrice: 49990,
    discountPercentage: 37,
    couponCode: 'GAMING3000',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.amazon.in/dp/B0CX23M111',
    isLootDeal: false,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 198,
    downvotes: 12,
    aiScore: 89,
    aiVerdict: 'Solid entry-level gaming laptop deal under 50k with 16GB DDR5 RAM preinstalled.',
    aiPros: [
      '16GB RAM out of the box eliminates upgrade needs',
      '144Hz smooth gaming display panel',
      'Under 50k gaming laptop milestone'
    ],
    aiCons: [
      'No integrated iGPU on 7435HS means shorter battery life on power'
    ],
    postedAt: '2 hours ago',
    priceHistory: [
      { date: 'Jul 1', price: 58990 },
      { date: 'Jul 15', price: 54990 },
      { date: 'Jul 28', price: 52990 },
      { date: 'Aug 5', price: 49990 }
    ],
    commentsCount: 14,
    comments: [],
    viewsCount: 1840,
    postedBy: 'GamerGuy'
  },
  {
    id: 'deal-5',
    title: 'Nike Air Max SC Mens Running Shoes',
    description: 'Lightweight cushioning, durable real and synthetic leather upper, retro track vibes with visible Air cushioning.',
    store: 'Myntra',
    category: 'Fashion & Apparel',
    originalPrice: 5995,
    dealPrice: 2697,
    discountPercentage: 55,
    couponCode: 'MYNTRA500',
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.myntra.com/shoes/nike/nike-men-red-air-max-sc-running-shoes/14589201/buy',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: true,
    upvotes: 312,
    downvotes: 5,
    aiScore: 94,
    aiVerdict: '55% OFF on authentic Nike Air Max sneakers on Myntra End of Reason Sale. Multi-size stock available.',
    aiPros: [
      'Authentic Nike Air Max under 2.7k',
      'Combine with MYNTRA500 coupon code for extra savings',
      'Free 14-day hassle-free returns'
    ],
    aiCons: [
      'UK 9 and UK 10 sizes selling out rapid'
    ],
    postedAt: '3 hours ago',
    priceHistory: [
      { date: 'Jul 1', price: 4796 },
      { date: 'Jul 15', price: 4196 },
      { date: 'Jul 28', price: 3297 },
      { date: 'Aug 5', price: 2697 }
    ],
    commentsCount: 22,
    comments: [],
    viewsCount: 2980,
    postedBy: 'SneakerHead'
  },
  {
    id: 'deal-6',
    title: 'boAt Airdopes 141 ANC TWS Earbuds with 42H Playback',
    description: '32dB Active Noise Cancellation, Beast Mode 50ms Low Latency, ENx Tech, ASAP Charge (10 mins = 150 mins).',
    store: 'Boat',
    category: 'Audio & Headphones',
    originalPrice: 4490,
    dealPrice: 999,
    discountPercentage: 78,
    couponCode: 'BOATBOAT',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.boat-lifestyle.com/products/airdopes-141-anc',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: true,
    upvotes: 680,
    downvotes: 21,
    aiScore: 99,
    aiVerdict: 'MASSIVE LOOT DEAL! Active Noise Cancellation TWS under ₹1,000. All time record low price.',
    aiPros: [
      '32dB ANC under ₹1,000 price point',
      '78% discount flat from MRP',
      '42 hours monster total battery life'
    ],
    aiCons: [
      'Plastic build construction'
    ],
    postedAt: '35 mins ago',
    priceHistory: [
      { date: 'Jul 1', price: 1799 },
      { date: 'Jul 15', price: 1499 },
      { date: 'Jul 28', price: 1299 },
      { date: 'Aug 5', price: 999 }
    ],
    commentsCount: 51,
    comments: [],
    viewsCount: 6100,
    postedBy: 'LootQueen'
  },
  {
    id: 'deal-7',
    title: 'Levi\'s Men\'s 511 Slim Fit Mid Rise Jeans - Dark Wash',
    description: 'Classic 5-pocket styling, stretch denim comfort blend, branded button fly and copper rivets.',
    store: 'Ajio',
    category: 'Fashion & Apparel',
    originalPrice: 3999,
    dealPrice: 1399,
    discountPercentage: 65,
    couponCode: 'AJIOMANIA',
    imageUrl: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.ajio.com/levis-511-slim-fit-mid-rise-jeans/p/46123985',
    isLootDeal: false,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 145,
    downvotes: 4,
    aiScore: 88,
    aiVerdict: 'Original Levi\'s denim at 65% discount on Ajio Mania Sale.',
    aiPros: [
      'Original brand Levi\'s under 1.4k',
      'High durability stretch fabric',
      'Versatile dark indigo wash color'
    ],
    aiCons: [
      'Slim fit cut may run tight for relaxed fit preference'
    ],
    postedAt: '4 hours ago',
    priceHistory: [
      { date: 'Jul 1', price: 2799 },
      { date: 'Jul 15', price: 2199 },
      { date: 'Jul 28', price: 1799 },
      { date: 'Aug 5', price: 1399 }
    ],
    commentsCount: 8,
    comments: [],
    viewsCount: 1420,
    postedBy: 'StyleDeal'
  },
  {
    id: 'deal-8',
    title: 'Philips Air Fryer HD9200/90 (4.1 Litre, 1400W)',
    description: 'Rapid Air Technology with 90% Less Oil, Patented Starfish design for crispy fries and roasted vegetables.',
    store: 'Tata CLiQ',
    category: 'Home & Kitchen',
    originalPrice: 9995,
    dealPrice: 4899,
    discountPercentage: 51,
    couponCode: 'CLIQLUXE',
    imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.tatacliq.com/philips-hd9200-90-4-1-l-air-fryer-black/p-mp00000000789',
    isLootDeal: false,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 210,
    downvotes: 6,
    aiScore: 91,
    aiVerdict: 'Top rated Philips Air Fryer at over 50% discount with 2-year manufacturer warranty.',
    aiPros: [
      'Market leader Philips quality build',
      'Uses 90% less oil for healthy cooking',
      'Easy wash dishwasher-safe basket'
    ],
    aiCons: [
      '4.1L capacity ideal for 2-3 people family'
    ],
    postedAt: '5 hours ago',
    priceHistory: [
      { date: 'Jul 1', price: 6995 },
      { date: 'Jul 15', price: 5995 },
      { date: 'Jul 28', price: 5499 },
      { date: 'Aug 5', price: 4899 }
    ],
    commentsCount: 11,
    comments: [],
    viewsCount: 1950,
    postedBy: 'KitchenPro'
  },
  {
    id: 'deal-9',
    title: 'LG 139 cm (55 inches) 4K Ultra HD Smart LED TV (55UR7500PSC)',
    description: 'α5 AI Processor Gen6, WebOS 23, HDR10 Pro, Game Optimizer, 4K Upscaling, AI Sound with 20W Output.',
    store: 'Croma',
    category: 'Electronics & Laptops',
    originalPrice: 71990,
    dealPrice: 38990,
    discountPercentage: 46,
    couponCode: 'CROMA5000',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.croma.com/lg-139-cm-55-inch-4k-ultra-hd-webos-tv/p/271890',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: false,
    upvotes: 340,
    downvotes: 15,
    aiScore: 93,
    aiVerdict: 'Brilliant deal for a brand tier-1 55" 4K Smart TV under 39k with free installation.',
    aiPros: [
      'LG WebOS 23 smooth UI & Magic Remote support',
      'Flat ₹33,000 drop from list MRP',
      'Free doorstep wall mount installation'
    ],
    aiCons: [
      'Standard 60Hz panel refresh rate'
    ],
    postedAt: '6 hours ago',
    priceHistory: [
      { date: 'Jul 1', price: 46990 },
      { date: 'Jul 15', price: 42990 },
      { date: 'Jul 28', price: 40990 },
      { date: 'Aug 5', price: 38990 }
    ],
    commentsCount: 27,
    comments: [],
    viewsCount: 3100,
    postedBy: 'CinemaKing'
  },
  {
    id: 'deal-10',
    title: 'Noise ColorFit Pro 5 Smartwatch with 1.85" AMOLED Display',
    description: 'Bluetooth Calling, Rapid Charge, DIY Watch Faces, Functional Crown, Health Suite (SpO2, 24x7 Heart Rate).',
    store: 'Noise',
    category: 'Smartwatches',
    originalPrice: 8999,
    dealPrice: 1999,
    discountPercentage: 77,
    couponCode: 'NOISE100',
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
    dealUrl: 'https://www.gonoise.com/products/colorfit-pro-5-smartwatch',
    isLootDeal: true,
    isVerified: true,
    isExpiringSoon: true,
    upvotes: 410,
    downvotes: 9,
    aiScore: 95,
    aiVerdict: 'AMOLED screen Bluetooth calling smartwatch at sub-2k loot deal price tag!',
    aiPros: [
      '1.85" high brightness AMOLED panel',
      '77% massive price markdown',
      'Rotating crown navigation dial'
    ],
    aiCons: [
      'Battery lasts 2-3 days with BT calling active'
    ],
    postedAt: '1 hour ago',
    priceHistory: [
      { date: 'Jul 1', price: 3499 },
      { date: 'Jul 15', price: 2999 },
      { date: 'Jul 28', price: 2499 },
      { date: 'Aug 5', price: 1999 }
    ],
    commentsCount: 31,
    comments: [],
    viewsCount: 3890,
    postedBy: 'NoiseLover'
  }
];
