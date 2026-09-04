import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  total: number;          // total matching records
  page: number;           // current 1-based page
  perPage: number;        // items per page
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  perPageOptions?: number[];
  disabled?: boolean;
}

/** Builds a compact list of page numbers to render, inserting ellipsis gaps. */
function pageList(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(totalPages - 1, current + 1);
  if (start > 2) pages.push('…');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 1) pages.push('…');
  pages.push(totalPages);
  return pages;
}

export const Pagination: React.FC<PaginationProps> = ({
  total, page, perPage, onPageChange, onPerPageChange,
  perPageOptions = [10, 25, 50, 100], disabled = false,
}) => {
  const opts = perPageOptions.length ? perPageOptions : [10, 25, 50, 100];
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * perPage + 1;
  const to = Math.min(safePage * perPage, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60 rounded-b-2xl">
      <div className="flex items-center gap-2 text-[11px] text-slate-500">
        <span className="font-medium">
          Showing <span className="font-bold text-slate-700">{from}–{to}</span> of{' '}
          <span className="font-bold text-slate-700">{total}</span> records
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          <label className="text-slate-400">Rows</label>
          <select
            value={perPage}
            disabled={disabled}
            onChange={e => onPerPageChange(Number(e.target.value))}
            className="px-2 py-1 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
          >
            {opts.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(safePage - 1)}
          disabled={disabled || safePage <= 1}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>

        {pageList(safePage, totalPages).map((p, i) =>
          p === '…' ? (
            <span key={`gap-${i}`} className="px-1.5 text-slate-400 text-xs">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={disabled}
              className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-colors ${
                p === safePage ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
              } disabled:opacity-50`}
            >
              {p}
            </button>
          ),
        )}

        <button
          onClick={() => onPageChange(safePage + 1)}
          disabled={disabled || safePage >= totalPages}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;