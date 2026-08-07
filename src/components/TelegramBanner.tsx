import React from 'react';
import { Send, Zap, Bell, Sparkles } from 'lucide-react';

export const TelegramBanner: React.FC = () => {
  return (
    <div id="telegram-banner-container" className="hidden md:block bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="inline-flex items-center justify-center p-1 bg-white/20 rounded-full animate-pulse">
            <Zap className="w-4 h-4 text-yellow-200" />
          </span>
          <p className="font-medium">
            <strong className="font-bold underline decoration-yellow-300">LOOT ALERT:</strong> Get instant notifications for 90% OFF pricing errors & price drops before stocks run out!
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <a
            href="https://t.me"
            target="_blank"
            rel="noopener noreferrer"
            id="join-telegram-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-white text-orange-600 rounded-full font-semibold text-xs shadow-sm hover:bg-orange-50 transition-colors"
          >
            <Send className="w-3.5 h-3.5 text-sky-500" />
            Join Telegram Channel
          </a>
          <button
            onClick={() => alert("Subscribed to WhatsApp Loot Deals Alerts!")}
            id="join-whatsapp-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-emerald-600 text-white rounded-full font-semibold text-xs hover:bg-emerald-700 transition-colors"
          >
            <Bell className="w-3.5 h-3.5" />
            WhatsApp Alerts
          </button>
        </div>
      </div>
    </div>
  );
};
