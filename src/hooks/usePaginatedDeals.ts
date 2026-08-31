import { useCallback, useEffect, useRef, useState } from 'react';
import { Deal } from '../types';
import { DealQueryParams, PaginatedResult, supabaseDb } from '../db/supabaseDb';

export interface UsePaginatedDealsOptions extends DealQueryParams {
  /** page size (default 12) */
  limit?: number;
  /** re-run when these change (stringified by the caller) */
  resetKey?: string;
}

export interface PaginatedDealsState {
  deals: Deal[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  loadMore: () => void;
  retry: () => void;
  goToPage: (page: number) => void;
}

// Server-side pagination hook for the User App (Home + Category pages).
// Fetches only the required page of products via the deals-api
// Supabase Function (with direct-DB / local fallbacks inside supabaseDb).
export function usePaginatedDeals(options: UsePaginatedDealsOptions): PaginatedDealsState {
  const { limit = 12, resetKey = '', ...queryParams } = options;

  const [deals, setDeals] = useState<Deal[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ total: 0, totalPages: 0, hasMore: false });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const requestIdRef = useRef(0);

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    if (append) setIsLoadingMore(true); else setIsLoading(true);
    setError(null);
    try {
      const result: PaginatedResult<Deal> = await supabaseDb.getDealsPaginated({
        ...queryParams,
        page: targetPage,
        limit,
      });
      // Ignore stale responses (out-of-order page loads)
      if (requestId !== requestIdRef.current) return;
      setDeals(prev => (append ? [...prev, ...result.items] : result.items));
      setMeta({ total: result.total, totalPages: result.totalPages, hasMore: result.hasMore });
      setPage(result.page);
    } catch (e: any) {
      if (requestId !== requestIdRef.current) return;
      setError(e?.message || 'Failed to load deals. Please try again.');
      if (!append) setDeals([]);
      setMeta(m => ({ ...m, hasMore: false }));
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, resetKey, reloadToken, queryParams.category, queryParams.store, queryParams.search, queryParams.sortBy, queryParams.onlyLoot, queryParams.onlyCoupons]);

  // Reload from page 1 whenever filters/sort change
  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !meta.hasMore) return;
    fetchPage(page + 1, true);
  }, [fetchPage, isLoading, isLoadingMore, meta.hasMore, page]);

  const goToPage = useCallback((target: number) => {
    const clamped = Math.max(1, Math.min(meta.totalPages || 1, Math.floor(target)));
    if (clamped !== page) fetchPage(clamped, false);
  }, [fetchPage, meta.totalPages, page]);

  const retry = useCallback(() => {
    fetchPage(page, false);
  }, [fetchPage, page]);

  return {
    deals,
    page,
    limit,
    total: meta.total,
    totalPages: meta.totalPages,
    hasMore: meta.hasMore,
    isLoading,
    isLoadingMore,
    error,
    loadMore,
    retry,
    goToPage,
  };
}