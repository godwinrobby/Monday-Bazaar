import React from 'react';
import { Deal } from '../types';
import { AlertTriangle, ChevronDown, Loader2 } from 'lucide-react';

interface PaginatedDealGridProps {
  deals: Deal[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  total: number;
  page: number;
  totalPages: number;
  onRetry: () => void;
  onLoadMore: () => void;
  renderDeal: (deal: Deal) => React.ReactNode;
  /** Shown when the first page loaded successfully but contains no products */
  emptyState?: React.ReactNode;
  skeletonCount?: number;
}

const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-3xl p-5 border border-slate-200 animate-pulse space-y-4">
    <div className="w-full h-44 bg-slate-100 rounded-2xl"></div>
    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
    <div className="flex justify-between items-center pt-2">
      <div className="h-6 bg-slate-100 rounded w-20"></div>
      <div className="h-8 bg-slate-100 rounded-xl w-24"></div>
    </div>
  </div>
);

// Shared server-paginated product grid for the User App:
// loading skeletons, error state with retry, empty state and Load More.
export const PaginatedDealGrid: React.FC<PaginatedDealGridProps> = ({
  deals,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  total,
  page,
  totalPages,
  onRetry,
  onLoadMore,
  renderDeal,
  emptyState,
  skeletonCount = 8,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: skeletonCount }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  if (error && deals.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-red-100 max-w-lg mx-auto my-8 space-y-4 shadow-sm">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Couldn't Load Deals</h3>
        <p className="text-xs text-slate-500 leading-relaxed">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-orange-500 text-white font-bold text-xs rounded-xl hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (deals.length === 0) {
    return <>{emptyState}</>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {deals.map((deal) => renderDeal(deal))}
        {isLoadingMore && <SkeletonCard />}
      </div>

      {/* Inline error while appending more pages */}
      {error && deals.length > 0 && (
        <div className="mt-4 flex items-center justify-center gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
          <p className="text-xs text-red-700 font-semibold">{error}</p>
          <button onClick={onRetry} className="text-xs font-bold text-red-700 underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Pagination footer */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <p className="text-[11px] text-slate-500 font-semibold">
          Showing {deals.length} of {total} deals · Page {page}{totalPages > 1 ? ` of ${totalPages}` : ''}
        </p>
        {hasMore && (
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-xl hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-xs"
          >
            {isLoadingMore
              ? <><Loader2 className="w-4 h-4 animate-spin text-orange-500" /> Loading…</>
              : <><ChevronDown className="w-4 h-4 text-orange-500" /> Load More Deals</>}
          </button>
        )}
      </div>
    </>
  );
};