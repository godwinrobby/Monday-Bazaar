import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, Tag, Truck, CreditCard } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ecommerce } from '../db/ecommerce';
import { EcCoupon } from '../types/ecommerce';

export const EcCartPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, removeItem, updateQuantity, itemCount, subtotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<EcCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const applyCoupon = useCallback(async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const coupon = await ecommerce.getCouponByCode(couponCode);
      if (!coupon) { setCouponError('Coupon code not found'); return; }
      if (!coupon.is_active) { setCouponError('This coupon is not active'); return; }
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) { setCouponError('This coupon is not yet valid'); return; }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) { setCouponError('This coupon has expired'); return; }
      if (coupon.usage_limit && coupon.used >= coupon.usage_limit) { setCouponError('Usage limit reached'); return; }
      if (subtotal < (coupon.min_order || 0)) { setCouponError(`Minimum order ${coupon.min_order} required`); return; }
      setAppliedCoupon(coupon);
      setCouponError(null);
    } catch (e: any) { setCouponError(e.message || 'Failed to apply coupon'); }
    finally { setCouponLoading(false); }
  }, [couponCode, subtotal]);

  const removeCoupon = () => { setAppliedCoupon(null); setCouponCode(''); setCouponError(null); };

  const discount = (() => {
    if (!appliedCoupon) return 0;
    const raw = appliedCoupon.type === 'percent' ? Math.round((subtotal * appliedCoupon.value) / 100) : appliedCoupon.value;
    const capped = appliedCoupon.max_discount != null ? Math.min(raw, appliedCoupon.max_discount) : raw;
    return Math.min(capped, subtotal);
  })();

  const total = subtotal - discount;
  const proceedToCheckout = () => { if (items.length === 0) return; navigate('/checkout'); };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-6">Looks like you haven't added anything to your cart yet.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600">
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/shop" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-500" /> Your Shopping Cart
        </h1>
        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">{itemCount} items</span>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <CartItemRow key={`${item.productId}-${item.variantId || 'main'}`} item={item} removeItem={removeItem} updateQuantity={updateQuantity} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <Tag className="w-4 h-4" /> Apply Coupon
          </div>
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
              <div>
                <span className="font-bold text-emerald-800">{appliedCoupon.code}</span>
                <span className="ml-2 text-slate-600">
                  {appliedCoupon.type === 'percent' ? `${appliedCoupon.value}% off` : `₹${appliedCoupon.value} off`}
                </span>
              </div>
              <button onClick={removeCoupon} className="p-1 text-red-500 hover:bg-red-50 rounded-lg">
                <Plus className="w-3 h-3 rotate-45" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code (e.g. SAVE10)"
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <button onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}
                  className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1">
                  {couponLoading ? 'Applying...' : 'Apply'}
                </button>
              </div>
              {couponError && <p className="text-xs text-red-600">• {couponError}</p>}
            </>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><CreditCard className="w-4 h-4" /> Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal ({itemCount} items)</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            {appliedCoupon && <div className="flex justify-between text-emerald-600"><span>Discount ({appliedCoupon.code})</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span className="text-xs italic">Calculated at checkout</span></div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-lg text-slate-900"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>
          <button onClick={proceedToCheckout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white font-black rounded-xl hover:bg-indigo-600">
            <Truck className="w-4 h-4" /> Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

const CartItemRow: React.FC<{
  item: any;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId?: string, quantity?: number) => void;
}> = ({ item, removeItem, updateQuantity }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
    <img src={item.image || 'https://placehold.co/80x80'} alt={item.productName}
      className="w-20 h-20 rounded-xl object-cover bg-slate-50"
      onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/80x80?text=No+Img'; }} />
    <div className="flex-1 space-y-1">
      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.productName}</h3>
      {item.variantId && <div className="text-xs text-slate-500">Variant: {item.attributes && Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>}
      {item.sku && <div className="text-xs text-slate-400 font-mono">SKU: {item.sku}</div>}
      <div className="flex items-center gap-2"><span className="text-sm font-bold text-indigo-600">₹{Number(item.price).toLocaleString('en-IN')}</span></div>
    </div>
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)} className="px-2 py-1 hover:bg-slate-50 text-slate-600"><Minus className="w-3 h-3" /></button>
        <span className="px-2 font-bold text-sm">{item.quantity}</span>
        <button onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)} disabled={item.quantity >= item.stock && item.stock > 0} className="px-2 py-1 hover:bg-slate-50 text-slate-600 disabled:opacity-50"><Plus className="w-3 h-3" /></button>
      </div>
      <span className="text-sm font-bold text-slate-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
      <button onClick={() => removeItem(item.productId, item.variantId)} className="p-1 text-red-500 hover:bg-red-50 rounded-lg" title="Remove from cart"><Trash2 className="w-4 h-4" /></button>
    </div>
  </div>
);
