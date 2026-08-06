import React from 'react';
import { PriceHistoryPoint } from '../types';
import { TrendingDown, Award, Calendar } from 'lucide-react';

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryPoint[];
  currentPrice: number;
  originalPrice: number;
}

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  priceHistory,
  currentPrice,
  originalPrice,
}) => {
  if (!priceHistory || priceHistory.length === 0) return null;

  const prices = priceHistory.map(p => p.price);
  const minPrice = Math.min(...prices, currentPrice);
  const maxPrice = Math.max(...prices, originalPrice);
  const priceRange = Math.max(maxPrice - minPrice, 100);

  // SVG chart dimensions
  const width = 480;
  const height = 160;
  const padding = 30;

  const points = priceHistory.map((pt, idx) => {
    const x = padding + (idx / Math.max(priceHistory.length - 1, 1)) * (width - 2 * padding);
    const y = height - padding - ((pt.price - minPrice) / priceRange) * (height - 2 * padding);
    return { x, y, date: pt.date, price: pt.price };
  });

  const polylinePoints = points.map(p => `${p.x},${p.y}`).join(' ');

  const isHistoricalLow = currentPrice <= minPrice;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-4 shadow-inner">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-100">30-Day Price Tracker</h4>
            <p className="text-[11px] text-slate-400">Verified price history collected across sales</p>
          </div>
        </div>

        {isHistoricalLow && (
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-xs rounded-full flex items-center gap-1">
            <Award className="w-3.5 h-3.5" />
            All-Time Low Price!
          </span>
        )}
      </div>

      {/* SVG Chart */}
      <div className="relative w-full overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
          {/* Horizontal grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#334155" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#334155" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#334155" strokeDasharray="3 3" />

          {/* Area fill gradient */}
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area under curve */}
          <polygon
            points={`${points[0].x},${height - padding} ${polylinePoints} ${points[points.length - 1].x},${height - padding}`}
            fill="url(#priceGradient)"
          />

          {/* Price Line */}
          <polyline
            fill="none"
            stroke="#f97316"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Data Points */}
          {points.map((pt, i) => (
            <g key={i} className="group/point">
              <circle
                cx={pt.x}
                cy={pt.y}
                r="5"
                className="fill-orange-500 stroke-slate-900 stroke-2 hover:r-7 transition-all cursor-pointer"
              />
              <text
                x={pt.x}
                y={pt.y - 10}
                textAnchor="middle"
                className="text-[10px] font-bold fill-slate-200 pointer-events-none"
              >
                ₹{pt.price.toLocaleString('en-IN')}
              </text>
              <text
                x={pt.x}
                y={height - 10}
                textAnchor="middle"
                className="text-[9px] font-medium fill-slate-400 pointer-events-none"
              >
                {pt.date}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block uppercase">Lowest Price</span>
          <span className="font-bold text-emerald-400">₹{minPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block uppercase">Current Deal</span>
          <span className="font-bold text-orange-400">₹{currentPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-slate-800/60 p-2 rounded-xl">
          <span className="text-[10px] text-slate-400 block uppercase">Highest MRP</span>
          <span className="font-bold text-slate-300">₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

    </div>
  );
};
