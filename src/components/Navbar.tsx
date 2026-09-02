import React from 'react';
import { NavLink } from 'react-router-dom';
import { Flame, Tag, Store, Heart, Sparkles, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({ savedCount }) => {
  const { itemCount } = useCart();
  const navItems = [
    {
      to: '/',
      label: 'All Deals',
      icon: <Flame className="w-4 h-4 fill-amber-400 text-amber-500" />,
      exact: true,
    },
    {
      to: '/loot',
      label: 'Loot Deals',
      icon: <Sparkles className="w-4 h-4 text-red-500" />,
      badge: 'HOT',
    },
    {
      to: '/categories',
      label: 'Categories',
      icon: <Tag className="w-4 h-4 text-orange-500" />,
    },
    {
      to: '/stores',
      label: 'Stores',
      icon: <Store className="w-4 h-4 text-blue-500" />,
    },
    {
      to: '/shop',
      label: 'E-Commerce',
      icon: <ShoppingBag className="w-4 h-4 text-indigo-500" />,
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-500" />,
      count: itemCount,
    },
    {
      to: '/watchlist',
      label: 'Watchlist',
      icon: <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />,
      count: savedCount,
    },
  ];

  return (
    <nav className="bg-slate-900 text-slate-200 border-b border-slate-800 sticky top-[57px] sm:top-[61px] z-20 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 no-scrollbar scroll-smooth">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.2 bg-red-600 text-white font-extrabold text-[9px] rounded-full uppercase tracking-wide">
                  {item.badge}
                </span>
              )}
              {typeof item.count === 'number' && item.count > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white font-extrabold text-[10px] rounded-full">
                  {item.count}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};
