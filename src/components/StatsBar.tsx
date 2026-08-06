import React from 'react';
import { Flame, IndianRupee, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

export const StatsBar: React.FC = () => {
  return (
    <div id="stats-bar-section" className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 overflow-x-auto py-0.5 no-scrollbar">
          <div className="flex items-center gap-1.5 whitespace-nowrap text-amber-400 font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span>240+ Active Deals Today</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 whitespace-nowrap text-emerald-400 font-semibold">
            <IndianRupee className="w-3.5 h-3.5" />
            <span>₹4.8 Lakhs Saved by Users</span>
          </div>
          <div className="flex items-center gap-1.5 whitespace-nowrap text-sky-400">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Amazon, Flipkart, Myntra, Ajio & 10+ Stores</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 whitespace-nowrap text-indigo-300">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>100% Price Drop Verified</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Powered by Gemini AI Price Inspector</span>
        </div>
      </div>
    </div>
  );
};
