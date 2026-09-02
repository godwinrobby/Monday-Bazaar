import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Package, Loader2, Truck, MapPin, Calendar, ChevronLeft, CheckCircle } from 'lucide-react';
import { ecommerce } from '../db/ecommerce';
import { EcOrder, EcOrderStatus } from '../types/ecommerce';

export const EcTrackingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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

  const statusSteps: EcOrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered'];
  const currentStep = order ? statusSteps.indexOf(order.status || 'pending') : -1;

  // Generate simulated tracking events
  const getTrackingEvents = (): { status: string; label: string; description: string; timestamp: string; completed: boolean }[] => {
    if (!order) return [];
    const baseDate = new Date(order.created_at || new Date());
    const events = [
      { status: 'pending', label: 'Order Placed', description: 'Your order has been received and is being processed.', completed: true, timestamp: baseDate.toISOString() },
      { status: 'confirmed', label: 'Order Confirmed', description: 'Your order has been confirmed by the seller.', completed: currentStep >= 1, timestamp: new Date(baseDate.getTime() + 5 * 60000).toISOString() },
      { status: 'shipped', label: 'Shipped', description: `Your order has been handed over to ${order.tracking_company || 'the carrier'} for delivery.`, completed: currentStep >= 2, timestamp: order.tracking_number ? new Date(baseDate.getTime() + 2 * 24 * 60 * 60000).toISOString() : '' },
      { status: 'delivered', label: 'Delivered', description: 'Your order has been delivered.', completed: currentStep >= 3, timestamp: order.tracking_number ? new Date(baseDate.getTime() + 5 * 24 * 60 * 60000).toISOString() : '' },
    ];
    return events;
  };

  if (loading) return <div className="py-16 text-center text-slate-400"><Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" />Loading tracking...</div>;
  if (error || !order) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      <Package className="w-12 h-12 mx-auto text-slate-300 mb-4" />
      <p className="text-slate-500 mb-4">• {error || 'Order not found'}</p>
      <Link to="/orders" className="text-indigo-600 hover:underline">Back to Orders</Link>
    </div>
  );

  const events = getTrackingEvents();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link to={`/orders/${order.id}`} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ChevronLeft className="w-5 h-5 text-slate-600" /></Link>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
          <Truck className="w-6 h-6 text-indigo-500" /> Shipment Tracking
        </h1>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="font-bold text-slate-900">Order #{order.order_number?.slice(-8) || order.id.slice(-8)}</div>
            {order.tracking_number && (
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                <span className="font-mono font-bold">{order.tracking_number}</span>
                {order.tracking_company && <span>via {order.tracking_company}</span>}
              </div>
            )}
          </div>
        </div>

        {!order.tracking_number ? (
          <div className="text-center py-8 text-slate-400">
            <Package className="w-8 h-8 mx-auto mb-2" />
            <p>No tracking number assigned yet. Your order is being processed.</p>
          </div>
        ) : (
          <div className="relative">
            {events.map((event, idx) => {
              const isLast = idx === events.length - 1;
              return (
                <div key={event.status} className="relative pb-6 last:pb-0">
                  <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-200 last:bg-transparent"></div>
                  <div className="relative flex items-start gap-4">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${event.completed ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'} flex-shrink-0`}>
                      {event.completed ? <CheckCircle className="w-3 h-3" /> : <div className="w-2 h-2 rounded-full bg-slate-400"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-slate-900 text-sm">{event.label}</div>
                        {event.completed && event.timestamp && (
                          <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(event.timestamp).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mt-0.5">{event.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-200">
          <h3 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Delivery To</h3>
          <div className="text-sm text-slate-600 space-y-0.5">
            <div className="font-bold">{order.address?.name}</div>
            <div>{order.address?.line1} {order.address?.line2}</div>
            <div>{order.address?.city}, {order.address?.state} {order.address?.pincode}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
