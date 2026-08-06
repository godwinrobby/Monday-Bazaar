import React, { useState } from 'react';
import { Deal } from '../types';
import { X, Bell, Check, Mail, IndianRupee } from 'lucide-react';

interface PriceAlertModalProps {
  deal: Deal | null;
  onClose: () => void;
}

export const PriceAlertModal: React.FC<PriceAlertModalProps> = ({
  deal,
  onClose,
}) => {
  if (!deal) return null;

  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState((deal.dealPrice * 0.9).toFixed(0));
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !targetPrice) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      onClose();
    }, 2000);
  };

  return (
    <div id="price-alert-modal-overlay" className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-100 text-amber-600 rounded-xl">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Set Price Drop Alert</h3>
              <p className="text-[11px] text-slate-500">Get notified when price drops further</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        {subscribed ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">Alert Subscribed!</h4>
            <p className="text-xs text-slate-500">
              We will send an instant email notification to <strong>{email}</strong> if {deal.title} reaches ₹{targetPrice}!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Selected Product</span>
              <p className="font-bold text-slate-900 line-clamp-1">{deal.title}</p>
              <p className="text-slate-500">Current Deal Price: <strong className="text-slate-900">₹{deal.dealPrice.toLocaleString('en-IN')}</strong></p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Target Alert Price (₹)</label>
              <div className="relative">
                <IndianRupee className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Your Notification Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              Set Target Price Alert
            </button>

          </form>
        )}

      </div>
    </div>
  );
};
