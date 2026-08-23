export interface DealCSVRow {
  title: string;
  description: string;
  store: string;
  category: string;
  originalPrice: number;
  dealPrice: number;
  discountPercentage: number;
  couponCode?: string;
  imageUrl: string;
  dealUrl: string;
  isLootDeal: boolean;
  isVerified: boolean;
  isExpiringSoon: boolean;
  isActive: boolean;
  upvotes: number;
  downvotes: number;
  userVoted?: 'up' | 'down';
  aiScore: number;
  aiVerdict: string;
  aiPros: string[];
  aiCons: string[];
  postedAt: string;
  expiryDate?: string;
  priceHistory: { date: string; price: number }[];
  commentsCount: number;
  comments: any[];
  viewsCount: number;
  postedBy: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseArrayField(value: string): string[] {
  if (!value) return [];
  return value.split('|').map(v => v.trim()).filter(v => v.length > 0);
}

function parsePriceHistory(value: string): { date: string; price: number }[] {
  if (!value) return [];
  return value.split('|').map(entry => {
    const [date, price] = entry.split(':');
    return { date: date?.trim() || '', price: Number(price) || 0 };
  }).filter(p => p.date);
}

export function parseDealsCSV(csvText: string): DealCSVRow[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const deals: DealCSVRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    deals.push({
      title: row.title || 'Untitled Deal',
      description: row.description || '',
      store: row.store || 'Amazon',
      category: row.category || 'All',
      originalPrice: Number(row.originalPrice) || 0,
      dealPrice: Number(row.dealPrice) || 0,
      discountPercentage: Number(row.discountPercentage) || 0,
      couponCode: row.couponCode || undefined,
      imageUrl: row.imageUrl || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80',
      dealUrl: row.dealUrl || 'https://www.amazon.in',
      isLootDeal: row.isLootDeal === 'true' || row.isLootDeal === 'TRUE',
      isVerified: row.isVerified === 'true' || row.isVerified === 'TRUE',
      isExpiringSoon: row.isExpiringSoon === 'true' || row.isExpiringSoon === 'TRUE',
      isActive: row.isActive !== 'false' && row.isActive !== 'FALSE',
      upvotes: Number(row.upvotes) || 0,
      downvotes: Number(row.downvotes) || 0,
      userVoted: row.userVoted === 'up' || row.userVoted === 'down' ? row.userVoted : undefined,
      aiScore: Number(row.aiScore) || 85,
      aiVerdict: row.aiVerdict || '',
      aiPros: parseArrayField(row.aiPros),
      aiCons: parseArrayField(row.aiCons),
      postedAt: row.postedAt || 'Just now',
      expiryDate: row.expiryDate || undefined,
      priceHistory: parsePriceHistory(row.priceHistory),
      commentsCount: Number(row.commentsCount) || 0,
      comments: [],
      viewsCount: Number(row.viewsCount) || 0,
      postedBy: row.postedBy || 'CSV Import',
    });
  }
  
  return deals;
}
