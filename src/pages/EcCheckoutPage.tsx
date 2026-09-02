import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Truck, MapPin, CreditCard, Check, Loader2, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { ecommerce } from '../db/ecommerce';
import { EcCoupon, EcShippingMethod, EcPaymentMethod, EcAddress, EcOrderItem } from '../types/ecommerce';

export const EcCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, itemCount, subtotal, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shippingMethods, setShippingMethods] = useState<EcShippingMethod[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<EcPaymentMethod[]>([]);
  const [coupons, setCoupons] = useState<EcCoupon[]>([]);
  const [address, setAddress] = useState<EcAddress>({ name: '', phone: '', line1: '', city: '', state: '', pincode: '', country: 'India' });
  const [selectedShipping, setSelectedShipping] = useState<EcShippingMethod | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<EcPaymentMethod | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<EcCoupon | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sm, pm, cp] = await Promise.all([
        ecommerce.listShippingMethods(),
        ecommerce.listPaymentMethods(),
        ecommerce.listCoupons(),
      ]);
      setShippingMethods(sm.filter(s => s.enabled !== false));
      setPaymentMethods(pm.filter(p => p.enabled !== false));
      setCoupons(cp.filter(c => c.is_active !== false));
      const defShipping = sm.filter(s => s.enabled !== false)[0] || null;
      const defPayment = pm.filter(p => p.enabled !== false)[0] || null;
      setSelectedShipping(defShipping);
      setSelectedPayment(defPayment);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const applyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponError(null);
    try {
      const coupon = await ecommerce.getCouponByCode(couponInput);
      if (!coupon || coupon.is_active === false) { setCouponError('Coupon not found or inactive'); return; }
      const now = new Date();
      if (coupon.starts_at && new Date(coupon.starts_at) > now) { setCouponError('Not yet valid'); return; }
      if (coupon.ends_at && new Date(coupon.ends_at) < now) { setCouponError('Expired'); return; }
      if (coupon.usage_limit && coupon.used >= coupon.usage_limit) { setCouponError('Usage limit reached'); return; }
      if (subtotal < (coupon.min_order || 0)) { setCouponError(`Min order ₹${coupon.min_order}`); return; }
      setSelectedCoupon(coupon);
    } catch (e: any) {
      setCouponError(e.message || 'Failed to apply coupon');
    }
  };

  const discount = (() => {
    if (!selectedCoupon) return 0;
    const raw = selectedCoupon.type === 'percent'
      ? Math.round((subtotal * selectedCoupon.value) / 100)
      : selectedCoupon.value;
    const capped = selectedCoupon.max_discount != null ? Math.min(raw, selectedCoupon.max_discount) : raw;
    return Math.min(capped, subtotal);
  })();

  const shippingCharge = (() => {
    if (!selectedShipping) return 0;
    if (subtotal - discount >= (selectedShipping.min_order_free || 0) && selectedShipping.min_order_free > 0) return 0;
    return selectedShipping.charge;
  })();

  const total = subtotal - discount + shippingCharge;

  const isValidAddress = address.name && address.phone && address.line1 && address.city && address.state && address.pincode;

  const placeOrder = async () => {
    if (!isValidAddress) { setError('Please fill in all address fields'); return; }
    if (!selectedShipping) { setError('Please select a shipping method'); return; }
    if (!selectedPayment) { setError('Please select a payment method'); return; }
    setPlacing(true);
    setError(null);
    try {
      const orderItems: EcOrderItem[] = items.map(item => ({
        product_name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        total: item.price * item.quantity,
        image: item.image,
        product_id: item.productId,
        variant_id: item.variantId,
        attributes: item.attributes,
      }));

      const orderId = await ecommerce.placeOrder({
        customer_name: address.name,
        customer_email: 'customer@example.com',
        customer_phone: address.phone,
        address: address,
        status: 'pending',
        payment_method: selectedPayment.name,
        payment_status: selectedPayment.id === 'ec-pay-cod' ? 'pending' : 'pending',
        shipping_method: selectedShipping.name,
        shipping_charge: shippingCharge,
        subtotal: subtotal,
        discount: discount,
        coupon_code: selectedCoupon?.code,
        total: total,
        items: orderItems,
      });

      clearCart();
      navigate('/checkout/confirmation', { state: { orderId, total, itemCount } });
    } catch (e: any) {
      setError(e.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading checkout...</div>;
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">Your Cart is Empty</h2>
        <p className="text-slate-500 mb-6">Add items to your cart before checking out.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600">
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/cart" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ArrowLeft className="w-5 h-5 text-slate-600" /></Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-500" /> Checkout
        </h1>
      </div>

      {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">• {error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-indigo-500" /> Shipping Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={address.name || ''} onChange={(e) => setAddress({ ...address, name: e.target.value })} placeholder="Full Name *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.phone || ''} onChange={(e) => setAddress({ ...address, phone: e.target.value })} placeholder="Phone *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.line1 || ''} onChange={(e) => setAddress({ ...address, line1: e.target.value })} placeholder="Address Line 1 *" className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.line2 || ''} onChange={(e) => setAddress({ ...address, line2: e.target.value })} placeholder="Address Line 2 (optional)" className="sm:col-span-2 px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.city || ''} onChange={(e) => setAddress({ ...address, city: e.target.value })} placeholder="City *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.state || ''} onChange={(e) => setAddress({ ...address, state: e.target.value })} placeholder="State *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.pincode || ''} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} placeholder="Pincode *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
              <input value={address.country || ''} onChange={(e) => setAddress({ ...address, country: e.target.value })} placeholder="Country *" className="px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Truck className="w-4 h-4 text-indigo-500" /> Shipping Method</h3>
            <div className="space-y-2">
              {shippingMethods.map(sm => (
                <label key={sm.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all">
                  <input type="radio" name="shipping" checked={selectedShipping?.id === sm.id} onChange={() => setSelectedShipping(sm)} className="w-4 h-4 accent-indigo-500" />
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{sm.name}</div>
                    <div className="text-xs text-slate-500">{sm.estimated_days}</div>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">₹{sm.charge}{sm.min_order_free > 0 && <span className="text-xs text-slate-400 block">Free over ₹{sm.min_order_free}</span>}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Coupon */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4 text-rose-500" /> Coupon Code</h3>
            {selectedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                <span className="font-bold text-emerald-800">{selectedCoupon.code} - {selectedCoupon.type === 'percent' ? `${selectedCoupon.value}%` : `₹${selectedCoupon.value}`}</span>
                <button onClick={() => setSelectedCoupon(null)} className="text-red-500 hover:bg-red-50 rounded-lg p-1"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <>
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="Enter coupon code" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
                <button onClick={applyCoupon} className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl hover:bg-indigo-600">Apply Coupon</button>
                {couponError && <p className="text-xs text-red-600">• {couponError}</p>}
              </>
            )}
          </div>

          {/* Payment */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center gap-2"><CreditCard className="w-4 h-4 text-indigo-500" /> Payment Method</h3>
            <div className="space-y-2">
              {paymentMethods.map(pm => (
                <label key={pm.id} className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all">
                  <input type="radio" name="payment" checked={selectedPayment?.id === pm.id} onChange={() => setSelectedPayment(pm)} className="w-4 h-4 accent-indigo-500" />
                  <div className="flex-1 font-bold text-slate-900">{pm.name}</div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm h-fit">
          <h3 className="font-bold text-slate-900">Order Summary</h3>
          <div className="text-xs text-slate-500 space-y-1 max-h-40 overflow-y-auto">
            {items.slice(0, 3).map(item => (
              <div key={`${item.productId}-${item.variantId || 'main'}`} className="flex justify-between">
                <span className="truncate">{item.productName} × {item.quantity}</span>
                <span>₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            {items.length > 3 && <div className="text-slate-400">+{items.length - 3} more items</div>}
          </div>
          <div className="border-t border-slate-200 pt-2 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
            {selectedCoupon && <div className="flex justify-between text-emerald-600"><span>Discount ({selectedCoupon.code})</span><span>-₹{discount.toLocaleString('en-IN')}</span></div>}
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>₹{shippingCharge.toLocaleString('en-IN')}</span></div>
            <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-lg text-slate-900"><span>Total</span><span>₹{total.toLocaleString('en-IN')}</span></div>
          </div>
          <button onClick={placeOrder} disabled={placing || !isValidAddress || !selectedShipping || !selectedPayment}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-500 text-white font-black rounded-xl hover:bg-indigo-600 disabled:opacity-50">
            {placing ? <><Loader2 className="w-4 h-4 animate-spin" /> Placing Order...</> : <><Check className="w-4 h-4" /> Place Order</>}
          </button>
        </div>
      </div>
    </div>
  );
};
