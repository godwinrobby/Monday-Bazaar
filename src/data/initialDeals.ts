import { Deal, StoreInfo, StoreName } from '../types';

export const STORES_INFO: Record<StoreName, StoreInfo> = {
  Amazon: {
    name: 'Amazon',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
    badgeText: 'text-amber-700',
    borderColor: 'border-amber-400',
    accentColor: '#FF9900',
    dealsCount: 0,
  },
  Flipkart: {
    name: 'Flipkart',
    badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
    badgeText: 'text-blue-700',
    borderColor: 'border-blue-400',
    accentColor: '#2874F0',
    dealsCount: 0,
  },
  Myntra: {
    name: 'Myntra',
    badgeBg: 'bg-pink-100 text-pink-900 border-pink-300',
    badgeText: 'text-pink-700',
    borderColor: 'border-pink-400',
    accentColor: '#E40046',
    dealsCount: 0,
  },
  Ajio: {
    name: 'Ajio',
    badgeBg: 'bg-slate-100 text-slate-900 border-slate-300',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-400',
    accentColor: '#2C4152',
    dealsCount: 0,
  },
  'Tata CLiQ': {
    name: 'Tata CLiQ',
    badgeBg: 'bg-red-100 text-red-900 border-red-300',
    badgeText: 'text-red-700',
    borderColor: 'border-red-400',
    accentColor: '#DA251C',
    dealsCount: 0,
  },
  Croma: {
    name: 'Croma',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    badgeText: 'text-emerald-700',
    borderColor: 'border-emerald-400',
    accentColor: '#00B894',
    dealsCount: 0,
  },
  'Reliance Digital': {
    name: 'Reliance Digital',
    badgeBg: 'bg-red-50 text-red-800 border-red-200',
    badgeText: 'text-red-700',
    borderColor: 'border-red-300',
    accentColor: '#E21B23',
    dealsCount: 0,
  },
  Boat: {
    name: 'Boat',
    badgeBg: 'bg-red-100 text-red-900 border-red-300',
    badgeText: 'text-red-600',
    borderColor: 'border-red-400',
    accentColor: '#EA1D25',
    dealsCount: 0,
  },
  Noise: {
    name: 'Noise',
    badgeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300',
    badgeText: 'text-indigo-700',
    borderColor: 'border-indigo-400',
    accentColor: '#4F46E5',
    dealsCount: 0,
  },
  Samsung: {
    name: 'Samsung',
    badgeBg: 'bg-sky-100 text-sky-900 border-sky-300',
    badgeText: 'text-sky-700',
    borderColor: 'border-sky-400',
    accentColor: '#1428A0',
    dealsCount: 0,
  },
  Apple: {
    name: 'Apple',
    badgeBg: 'bg-gray-100 text-gray-900 border-gray-300',
    badgeText: 'text-gray-800',
    borderColor: 'border-gray-400',
    accentColor: '#000000',
    dealsCount: 0,
  }
};

export const INITIAL_DEALS: Deal[] = [];
