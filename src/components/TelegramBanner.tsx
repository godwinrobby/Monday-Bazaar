import React from 'react';
import { Zap } from 'lucide-react';

export const TelegramBanner: React.FC = () => {
  return (
    <div id="telegram-banner-container" className="hidden md:block bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-center gap-2.5 text-sm text-center">
        <span className="inline-flex items-center justify-center p-1 bg-white/20 rounded-full animate-pulse">
          <Zap className="w-4 h-4 text-yellow-200" />
        </span>
        <p className="font-medium">
          <strong className="font-bold underline decoration-yellow-300">LOOT ALERT:</strong> Get instant notifications for 90% OFF pricing errors & price drops before stocks run out!
        </p>
      </div>
    </div>
  );
};