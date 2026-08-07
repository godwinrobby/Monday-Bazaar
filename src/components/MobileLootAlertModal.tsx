import React, { useState, useEffect } from 'react';
import { Flame, X, Send, MessageCircle, Zap, ShieldCheck, Bell } from 'lucide-react';

export const MobileLootAlertModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    const isDismissed = sessionStorage.getItem('monday_bazaar_loot_alert_dismissed');
    if (!isDismissed) {
      // Small delay on mobile load for natural entrance
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('monday_bazaar_loot_alert_dismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center p-0 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-300">
      
      {/* Mobile Bottom Sheet Card */}
      <div 
        className="w-full bg-slate-900 border-t-2 border-amber-500 text-white rounded-t-3xl p-6 shadow-2xl space-y-5 relative animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto"
        id="mobile-loot-alert-popup"
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          id="close-mobile-loot-alert-btn"
          className="absolute top-4 right-4 p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          aria-label="Close notification"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl text-slate-950 shadow-md shadow-amber-500/20 animate-pulse">
            <Flame className="w-6 h-6 fill-slate-950" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-black uppercase tracking-wider rounded-full">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>LOOT ALERT</span>
            </span>
            <h3 className="text-xl font-black text-white tracking-tight leading-tight mt-0.5">
              90% OFF Pricing Errors & Drop Alerts
            </h3>
          </div>
        </div>

        {/* Message Content */}
        <p className="text-xs font-medium text-slate-300 leading-relaxed bg-slate-850/80 p-3.5 rounded-2xl border border-slate-800/80">
          Get instant notifications for <strong className="text-amber-400 font-bold">90% OFF pricing errors</strong> & price drops before stocks run out!
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3 pt-1">
          {/* Telegram Channel Button */}
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            id="join-telegram-alert-btn"
            className="w-full py-3.5 px-5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>Join Telegram Channel</span>
          </a>

          {/* WhatsApp Alerts Button */}
          <a
            href="https://whatsapp.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            id="join-whatsapp-alert-btn"
            className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>WhatsApp Alerts</span>
          </a>
        </div>

        {/* Dismiss Footer Link */}
        <div className="text-center pt-1 pb-1">
          <button
            onClick={handleClose}
            className="text-xs text-slate-500 hover:text-slate-400 font-semibold underline underline-offset-2 transition-colors"
          >
            No thanks, I'll miss the loot deals
          </button>
        </div>

        {/* Verified Badge */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 border-t border-slate-800/60 pt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Instant deal pushes • Zero spam guarantee</span>
        </div>

      </div>
    </div>
  );
};
