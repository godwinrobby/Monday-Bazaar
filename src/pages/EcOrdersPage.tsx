import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, X, ShoppingBag, ChevronRight, Truck } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcOrder } from '../types/ecommerce';

export const EcOrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<EcOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await ecommerce.listOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const statusColor: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading orders...</div>;
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-red-600 mb-4">• {error}</p>
        <button onClick={load} className="px-4 py-2 bg-indigo-500 text-white text-xs font-bold rounded-xl">Retry</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <h2 className="text-2xl font-black text-slate-900 mb-2">No Orders Yet</h2>
        <p className="text-slate-500 mb-6">You haven't placed any orders yet.</p>
        <Link to="/shop" className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><X className="w-5 h-5 text-slate-600" /></Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-indigo-500" /> My Orders
        </h1>
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold text-slate-900 text-sm">Order #{order.order_number?.slice(-8) || order.id.slice(-8)}</div>
                <div className="text-xs text-slate-500">{new Date(order.created_at || new Date().toISOString()).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${statusColor[order.status || 'pending']}`}>{order.status || 'pending'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {order.items?.slice(0, 3).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-lg bg-slate-100 flex-shrink-0">
                    {_?.image ? <img src={_} alt="" className="w-full h-full rounded-lg object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} /> : <Package className="w-5 h-5 m-2.5 text-slate-300" />}
                  </div>
                )) || []}
                {order.items && order.items.length > 3 && <span className="text-xs text-slate-400">+{order.items.length - 3} more</span>}
              </div>
              <div className="text-right">
                <div className="font-bold text-slate-900 text-sm">₹{Number(order.total || 0).toLocaleString('en-IN')}</div>
                <div className="text-xs text-slate-500">{order.items?.length || 0} items</div>
              </div>
              <Link to={`/orders/${order.id}`} className="ml-4 p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            {order.tracking_number && (
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
                <Truck className="w-4 h-4 inline mr-1" />
                Tracking: <span className="font-bold">{order.tracking_number}</span>
                <Link to={`/orders/${order.id}/track`} className="ml-2 text-indigo-600 hover:underline">Track</Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
