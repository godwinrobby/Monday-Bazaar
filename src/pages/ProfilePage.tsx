import React from 'react';
import { Link } from 'react-router-dom';
import {
  UserCircle, ShoppingCart, Package, Heart, ShoppingBag, Settings,
  ChevronRight, MapPin, CreditCard, Tag, LogOut,
} from 'lucide-react';
import { useCart } from '../context/CartContext';

export const ProfilePage: React.FC = () => {
  const { itemCount } = useCart();

  const links = [
    {
      to: '/orders',
      label: 'My Orders',
      desc: 'Track and manage your orders',
      icon: <Package className="w-5 h-5 text-indigo-500" />,
    },
    {
      to: '/cart',
      label: 'Your Cart',
      desc: `${itemCount} item${itemCount === 1 ? '' : 's'} ready to checkout`,
      icon: <ShoppingCart className="w-5 h-5 text-emerald-500" />,
    },
    {
      to: '/watchlist',
      label: 'Watchlist',
      desc: 'Deals you saved for later',
      icon: <Heart className="w-5 h-5 text-rose-500" />,
    },
    {
      to: '/shop',
      label: 'Continue Shopping',
      desc: 'Browse the e-commerce store',
      icon: <ShoppingBag className="w-5 h-5 text-amber-500" />,
    },
  ];

  const quickLinks = [
    { to: '/categories', label: 'Categories', icon: <Tag className="w-4 h-4" /> },
    { to: '/loot', label: 'Loot Deals', icon: <Tag className="w-4 h-4" /> },
    { to: '/stores', label: 'Stores', icon: <MapPin className="w-4 h-4" /> },
    { to: '/', label: 'Payment Methods', icon: <CreditCard className="w-4 h-4" /> },
    { to: '/', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 space-y-6">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
          <UserCircle className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">My Profile</h1>
          <p className="text-xs text-slate-500">Manage your orders, cart and preferences</p>
        </div>
      </div>

      {/* Primary links */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-slate-100">
        {links.map(l => (
          <Link key={l.to + l.label} to={l.to} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
            <div className="p-2.5 rounded-xl bg-slate-50 shrink-0">{l.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-slate-900 text-sm">{l.label}</div>
              <div className="text-xs text-slate-500 truncate">{l.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-300" />
          </Link>
        ))}
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Quick Links</h3>
        <div className="grid grid-cols-2 gap-3">
          {quickLinks.map(l => (
            <Link key={l.to + l.label} to={l.to} className="flex items-center gap-2.5 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors">
              <span className="text-indigo-500">{l.icon}</span>
              <span className="truncate">{l.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Sign out placeholder */}
      <button
        onClick={() => {}}
        className="w-full flex items-center justify-center gap-2 p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sign Out
      </button>

      <p className="text-center text-[10px] text-slate-400">You are browsing as a guest. Orders &amp; cart are stored on this device.</p>
    </div>
  );
};
