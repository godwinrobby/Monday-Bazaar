import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home, Tags, ShoppingBag, ShoppingCart, Package, UserCircle,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ecommerce } from '../db/ecommerce';

interface BottomNavProps {
  savedCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ savedCount = 0 }) => {
  const { itemCount } = useCart();
  const location = useLocation();
  const [orderCount, setOrderCount] = useState(0);

  // Lightweight order count for the Orders badge (load once).
  useEffect(() => {
    let active = true;
    ecommerce.listOrders()
      .then(orders => { if (active) setOrderCount(orders.length); })
      .catch(() => { if (active) setOrderCount(0); });
    return () => { active = false; };
  }, []);

  // Caps for the badges to keep them tidy.
  const cap = (n: number) => (n > 99 ? '99+' : String(n));

  const items = [
    { to: '/', label: 'Home', icon: Home, exact: true, badge: savedCount > 0 ? cap(savedCount) : '' },
    { to: '/categories', label: 'Categories', icon: Tags, exact: false, badge: '' },
    { to: '/shop', label: 'Shop', icon: ShoppingBag, exact: false, badge: '' },
    { to: '/cart', label: 'Cart', icon: ShoppingCart, exact: false, badge: itemCount > 0 ? cap(itemCount) : '' },
    { to: '/orders', label: 'Orders', icon: Package, exact: false, badge: orderCount > 0 ? cap(orderCount) : '' },
    { to: '/profile', label: 'Profile', icon: UserCircle, exact: false, badge: '' },
  ];

  return (
    <nav
      aria-label="Bottom navigation"
      className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-6 gap-0.5 px-1 pt-1.5 pb-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const match = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to || location.pathname.startsWith(item.to + '/');
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              aria-current={match ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                match ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className="relative">
                <Icon className={`w-[22px] h-[22px] ${match ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                {item.badge && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-0.5 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                    {item.badge}
                  </span>
                )}
              </span>
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
              {match && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-indigo-600" />}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
