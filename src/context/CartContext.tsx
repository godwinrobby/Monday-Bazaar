import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EcCartItem } from '../types/ecommerce';

interface CartContextType {
  items: EcCartItem[];
  addItem: (item: EcCartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId?: string, quantity?: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = 'mb_ecommerce_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<EcCartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((item: EcCartItem) => {
    setItems(prev => {
      const existing = prev.findIndex(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing >= 0) {
        const updated = [...prev];
        const newQty = Math.min(updated[existing].quantity + item.quantity, item.stock || 99);
        updated[existing] = { ...updated[existing], quantity: newQty };
        return updated;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string, variantId?: string) => {
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  }, []);

  const updateQuantity = useCallback((productId: string, variantId?: string, quantity: number = 1) => {
    setItems(prev => prev.map(i => {
      if (i.productId === productId && i.variantId === variantId) {
        const qty = Math.max(1, Math.min(quantity, i.stock || 99));
        return { ...i, quantity: qty };
      }
      return i;
    }));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
