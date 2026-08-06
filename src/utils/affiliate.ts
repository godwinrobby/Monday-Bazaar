import { StoreName } from '../types';

export interface StoreAffiliateConfig {
  store: StoreName;
  tagParam: string;
  tagValue: string;
  commissionRate: number; // percentage, e.g. 8.5
  isActive: boolean;
  notes?: string;
}

export const DEFAULT_AFFILIATE_CONFIGS: Record<StoreName, StoreAffiliateConfig> = {
  Amazon: {
    store: 'Amazon',
    tagParam: 'tag',
    tagValue: 'mondaybazaar-21',
    commissionRate: 8.5,
    isActive: true,
    notes: 'Amazon Associates India tag',
  },
  Flipkart: {
    store: 'Flipkart',
    tagParam: 'affid',
    tagValue: 'mondaybazaaff',
    commissionRate: 7.0,
    isActive: true,
    notes: 'Flipkart Affiliate ID',
  },
  Myntra: {
    store: 'Myntra',
    tagParam: 'aff_sub',
    tagValue: 'mondaybazaar_myntra',
    commissionRate: 10.0,
    isActive: true,
    notes: 'Myntra Partner Network',
  },
  Ajio: {
    store: 'Ajio',
    tagParam: 'utm_source',
    tagValue: 'mondaybazaar_affiliate',
    commissionRate: 9.0,
    isActive: true,
    notes: 'Ajio Partner UTM Tracking',
  },
  'Tata CLiQ': {
    store: 'Tata CLiQ',
    tagParam: 'icid',
    tagValue: 'mbz_tatacliq_2026',
    commissionRate: 6.5,
    isActive: true,
    notes: 'Tata CLiQ Affiliate Campaign',
  },
  Croma: {
    store: 'Croma',
    tagParam: 'utm_campaign',
    tagValue: 'mondaybazaar_croma',
    commissionRate: 5.0,
    isActive: true,
    notes: 'Croma Affiliate Tracking',
  },
  'Reliance Digital': {
    store: 'Reliance Digital',
    tagParam: 'ref_id',
    tagValue: 'mondaybazaar_rd',
    commissionRate: 5.5,
    isActive: true,
    notes: 'Reliance Digital Referral Code',
  },
  Boat: {
    store: 'Boat',
    tagParam: 'sca_ref',
    tagValue: 'mondaybazaar_boat',
    commissionRate: 12.0,
    isActive: true,
    notes: 'boAt Lifestyle Direct Affiliate',
  },
  Noise: {
    store: 'Noise',
    tagParam: 'ref',
    tagValue: 'mondaybazaar_noise',
    commissionRate: 11.0,
    isActive: true,
    notes: 'Noise Affiliate Referral',
  },
  Samsung: {
    store: 'Samsung',
    tagParam: 'CID',
    tagValue: 'in-aff-mbz-2026',
    commissionRate: 4.5,
    isActive: true,
    notes: 'Samsung Corporate Affiliate',
  },
  Apple: {
    store: 'Apple',
    tagParam: 'at',
    tagValue: '1000lmBZ',
    commissionRate: 3.5,
    isActive: true,
    notes: 'Apple Performance Network',
  },
};

/**
 * Transforms a raw deal URL by injecting store-specific affiliate tracking parameter
 */
export function buildAffiliateUrl(
  rawUrl: string,
  store: StoreName,
  configs: Record<StoreName, StoreAffiliateConfig> = DEFAULT_AFFILIATE_CONFIGS
): string {
  if (!rawUrl) return '#';
  const config = configs[store];
  if (!config || !config.isActive || !config.tagValue) {
    return rawUrl;
  }

  try {
    const urlObj = new URL(rawUrl);
    urlObj.searchParams.set(config.tagParam, config.tagValue);
    // Also add sub-tracking for analytics
    urlObj.searchParams.set('utm_source', 'monday_bazaar');
    urlObj.searchParams.set('utm_medium', 'deal_aggregator');
    return urlObj.toString();
  } catch {
    // If invalid URL format, append manually
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}${config.tagParam}=${encodeURIComponent(config.tagValue)}&utm_source=monday_bazaar`;
  }
}
