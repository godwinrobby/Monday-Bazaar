import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, ShoppingBag, Home } from 'lucide-react';

interface ConfirmationState {
  orderId?: string;
  total?: number;
  itemCount?: number;
}

export const EcCheckoutConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ConfirmationState | null;

  useEffect(() => {
    if (!state?.orderId) {
      navigate('/cart');
    }
  }, [state, navigate]);

  if (!state?.orderId) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
        <CheckCircle className="w-8 h-8 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-black text-slate-900 mb-2">Order Placed!</h1>
      <p className="text-slate-500 mb-6">
        Thank you for your order. Your order <span className="font-bold text-indigo-600">#{state.orderId.slice(-8)}</span> has been placed successfully.
      </p>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md mx-auto mb-8 shadow-sm">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between"><span className="text-slate-500">Order Total</span><span className="font-bold text-slate-900">₹{Number(state.total || 0).toLocaleString('en-IN')}</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Items</span><span className="font-bold text-slate-900">{state.itemCount} items</span></div>
          <div className="flex justify-between"><span className="text-slate-500">Payment</span><span className="font-bold text-slate-700">Cash on Delivery</span></div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/orders" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
          <Package className="w-5 h-5" /> View My Orders
        </Link>
        <Link to="/shop" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">
          <ShoppingBag className="w-5 h-5" /> Continue Shopping
        </Link>
        <Link to="/" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">
          <Home className="w-5 h-5" /> Back to Home
        </Link>
      </div>
    </div>
  );
};
