import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Package, Loader2, X, Truck, MapPin, Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcOrder, EcOrderStatus } from '../types/ecommerce';

export const EcOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<EcOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await ecommerce.getOrder(id);
      if (!data) { setError('Order not found'); return; }
      setOrder(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const statusColor: Record<EcOrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-sky-100 text-sky-700',
    shipped: 'bg-indigo-100 text-indigo-700',
    delivered: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusSteps: EcOrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStep = order ? statusSteps.indexOf(order.status || 'pending') : 0;

  if (loading) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading order...</div>;
  if (error || !order) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <p className="text-slate-500 mb-4">• {error || 'Order not found'}</p>
      <Link to="/orders" className="text-indigo-600 hover:underline">Back to Orders</Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/orders" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ChevronLeft className="w-5 h-5 text-slate-600" /></Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-indigo-500" /> Order Details
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-bold text-slate-900">Order #{order.order_number?.slice(-8) || order.id.slice(-8)}</div>
            <div className="text-sm text-slate-500 flex items-center gap-1 mt-1">
              <Calendar className="w-4 h-4" /> Placed on {new Date(order.created_at || new Date().toISOString()).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusColor[order.status || 'pending']}`}>{order.status || 'pending'}</span>
        </div>

        {/* Order Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span>Order Status</span>
            {order.tracking_number && (
              <Link to={`/orders/${order.id}/track`} className="text-indigo-600 hover:underline flex items-center gap-1">
                Track Shipment <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statusSteps.map((step, idx) => {
              const active = idx <= currentStep;
              const activeColor = idx <= currentStep ? 'bg-indigo-500' : 'bg-slate-300';
              return (
                <React.Fragment key={step}>
                  <div className="flex flex-col items-center flex-1">
                    <div className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${activeColor} flex-shrink-0`}></div>
                      <span className={`text-xs font-bold ${active ? 'text-indigo-600' : 'text-slate-400'}`}>{step}</span>
                    </div>
                  </div>
                  {idx < statusSteps.length - 1 && <div className={`flex-1 h-0.5 ${idx < currentStep ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Order Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Shipping Address</h3>
            <div className="text-sm text-slate-600 space-y-0.5">
              <div className="font-bold">{order.address?.name || 'N/A'}</div>
              <div>{order.address?.line1 || ''}</div>
              {order.address?.line2 && <div>{order.address.line2}</div>}
              <div>{order.address?.city}, {order.address?.state} {order.address?.pincode}</div>
              <div>{order.address?.country}</div>
              <div>Phone: {order.address?.phone}</div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-2">Payment & Shipping</h3>
              <div className="text-sm text-slate-600 space-y-1">
                <div><span className="text-slate-500">Payment:</span> {order.payment_method} ({order.payment_status})</div>
                <div><span className="text-slate-500">Shipping:</span> {order.shipping_method} (₹{Number(order.shipping_charge || 0).toLocaleString('en-IN')})</div>
                {order.coupon_code && <div><span className="text-slate-500">Coupon:</span> {order.coupon_code} (-₹{Number(order.discount || 0).toLocaleString('en-IN')})</div>}
              </div>
            </div>
            {order.tracking_number && (
              <div>
                <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-1"><Truck className="w-4 h-4" /> Tracking</h3>
                <div className="text-sm"><span className="text-slate-500">Tracking #:</span> <span className="font-bold font-mono">{order.tracking_number}</span></div>
                {order.tracking_company && <div className="text-slate-500">{order.tracking_company}</div>}
                <Link to={`/orders/${order.id}/track`} className="text-indigo-600 hover:underline text-xs mt-1 block">View Tracking Details →</Link>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div>
          <h3 className="font-bold text-slate-900 text-sm mb-3">Order Items</h3>
          <div className="space-y-3">
            {(order.items || []).map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="w-16 h-16 rounded-lg bg-slate-200 flex-shrink-0 overflow-hidden">
                  {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = ''; }} /> : <Package className="w-6 h-6 m-3 text-slate-300" />}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm">{item.product_name}</div>
                  {item.sku && <div className="text-xs text-slate-400 font-mono">SKU: {item.sku}</div>}
                  {item.variant_id && item.attributes && (
                    <div className="text-xs text-slate-500">
                      {Object.entries(item.attributes).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div>Qty: {item.quantity}</div>
                  <div className="font-bold">₹{Number(item.unit_price).toLocaleString('en-IN')}</div>
                  <div className="text-slate-500">Total: ₹{Number(item.total).toLocaleString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Totals */}
        <div className="border-t border-slate-200 pt-4 mt-4">
          <div className="space-y-2 text-sm max-w-xs ml-auto">
            <div className="flex justify-between text-slate-600"><span>Subtotal</span><span>₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span></div>
            <div className="flex justify-between text-slate-600"><span>Shipping</span><span>₹{Number(order.shipping_charge || 0).toLocaleString('en-IN')}</span></div>
            {order.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-₹{Number(order.discount || 0).toLocaleString('en-IN')}</span></div>}
            <div className="border-t border-slate-200 pt-2 flex justify-between font-black text-lg text-slate-900"><span>Total</span><span>₹{Number(order.total || 0).toLocaleString('en-IN')}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};
