import React from 'react';
import { PriceHistoryPoint } from '../types';
import { TrendingDown, Award, Calendar, ArrowDownRight, Info } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';

interface PriceHistoryChartProps {
  priceHistory: PriceHistoryPoint[];
  currentPrice: number;
  originalPrice: number;
}

const CustomTooltip = ({ active, payload, originalPrice, currentPrice }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isCurrent = data.price === currentPrice;
    const discountFromOriginal = Math.round(((originalPrice - data.price) / originalPrice) * 100);

    return (
      <div className="bg-slate-900 border border-slate-700 text-white p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[170px]">
        <div className="flex items-center justify-between gap-3 text-slate-400 font-semibold border-b border-slate-800 pb-1">
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            {data.date}
          </span>
          {isCurrent && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 text-[9px] font-black rounded-md uppercase tracking-wider">
              Current Deal
            </span>
          )}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block">Logged Price</span>
          <span className="text-base font-black text-amber-400">
            ₹{data.price.toLocaleString('en-IN')}
          </span>
        </div>
        {discountFromOriginal > 0 && (
          <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 pt-0.5">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>{discountFromOriginal}% below MRP (₹{originalPrice.toLocaleString('en-IN')})</span>
          </div>
        )}
      </div>
    );
  }
  return null;
};

export const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  priceHistory,
  currentPrice,
  originalPrice,
}) => {
  if (!priceHistory || priceHistory.length === 0) return null;

  // Clone data and ensure current price is attached or highlighted
  const chartData = [...priceHistory];
  
  const prices = chartData.map(p => p.price);
  const minPrice = Math.min(...prices, currentPrice);
  const maxPrice = Math.max(...prices, originalPrice);
  const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / (prices.length || 1));
  
  const isHistoricalLow = currentPrice <= minPrice;

  // Calculate formatted min/max for chart Y-Axis
  const yMin = Math.max(0, Math.floor((minPrice * 0.85) / 100) * 100);
  const yMax = Math.ceil((maxPrice * 1.05) / 100) * 100;

  return (
    <div id="price-trend-chart-container" className="bg-slate-950 text-slate-100 rounded-3xl p-5 border border-slate-800/80 space-y-4 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-100 flex items-center gap-2">
              <span>Historical Price Trend</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                Recharts Powered
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">Interactive 30-day price history & discount tracking</p>
          </div>
        </div>

        {isHistoricalLow && (
          <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-black text-xs rounded-full flex items-center gap-1.5 shadow-sm animate-pulse">
            <Award className="w-4 h-4 text-emerald-400" />
            All-Time Lowest Price!
          </span>
        )}
      </div>

      {/* Recharts Area Chart */}
      <div className="w-full h-56 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="priceAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />

            <XAxis
              dataKey="date"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />

            <YAxis
              domain={[yMin, yMax]}
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
            />

            <Tooltip
              content={
                <CustomTooltip
                  originalPrice={originalPrice}
                  currentPrice={currentPrice}
                />
              }
            />

            <ReferenceLine
              y={currentPrice}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: `Current: ₹${currentPrice.toLocaleString('en-IN')}`,
                fill: '#34d399',
                fontSize: 10,
                fontWeight: 'bold',
                position: 'top',
              }}
            />

            <Area
              type="monotone"
              dataKey="price"
              stroke="#f97316"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#priceAreaGradient)"
              activeDot={{ r: 7, fill: '#fb923c', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-slate-800/80 text-center text-xs">
        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lowest Recorded</span>
          <span className="font-black text-emerald-400 text-sm">₹{minPrice.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Current Deal Price</span>
          <span className="font-black text-amber-400 text-sm">₹{currentPrice.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">30-Day Average</span>
          <span className="font-bold text-slate-200 text-sm">₹{avgPrice.toLocaleString('en-IN')}</span>
        </div>

        <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">List MRP</span>
          <span className="font-bold text-slate-400 text-sm line-through">₹{maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Informational Footer Note */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800/60">
        <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>
          {isHistoricalLow
            ? 'This deal is currently matching or lower than its 30-day historical lowest price!'
            : `Current price is ₹${(currentPrice - minPrice).toLocaleString('en-IN')} above its 30-day historical low of ₹${minPrice.toLocaleString('en-IN')}.`}
        </span>
      </div>

    </div>
  );
};

