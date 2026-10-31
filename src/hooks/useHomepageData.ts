import { useEffect, useRef, useState } from 'react';
import {
  type AuctionTab,
  fetchAuctions,
  fetchCategoryTiles,
  fetchCategoryTree,
  fetchFeaturedProducts,
  fetchLiveRequirements,
  fetchMarketplaceOverview,
  fetchVerifiedSuppliers,
} from '@/lib/homepageData';

export interface LoadState<T> {
  data: T | null;
  loading: boolean;
  failed: boolean;
  /** When the data on screen was last loaded successfully (ms since epoch), or null. */
  updatedAt: number | null;
  retry: () => void;
}

/**
 * Runs a loader on mount, when the dependencies change, and on retry. With refreshMs it also
 * reloads quietly on an interval and keeps what is on screen if a refresh fails.
 */
export function useLoadable<T>(loader: () => Promise<T>, deps: readonly unknown[], refreshMs?: number): LoadState<T> {
  const [state, setState] = useState<{ data: T | null; loading: boolean; failed: boolean; updatedAt: number | null }>({
    data: null,
    loading: true,
    failed: false,
    updatedAt: null,
  });
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, failed: false, updatedAt: null });
    loaderRef
      .current()
      .then((data) => {
        if (active) setState({ data, loading: false, failed: false, updatedAt: Date.now() });
      })
      .catch(() => {
        if (active) setState({ data: null, loading: false, failed: true, updatedAt: null });
      });

    let timer: number | undefined;
    if (refreshMs) {
      timer = window.setInterval(() => {
        loaderRef
          .current()
          .then((data) => {
            if (active) setState({ data, loading: false, failed: false, updatedAt: Date.now() });
          })
          .catch(() => {
            // Keep the data already on screen when a background refresh fails.
          });
      }, refreshMs);
    }

    return () => {
      active = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [attempt, refreshMs, ...deps]);

  return { ...state, retry: () => setAttempt((count) => count + 1) };
}

export function useMarketplaceOverview() {
  return useLoadable(fetchMarketplaceOverview, [], 60_000);
}

export function useCategoryTree() {
  return useLoadable(fetchCategoryTree, []);
}

export function useCategoryTiles() {
  return useLoadable(() => fetchCategoryTiles(), []);
}

export function useVerifiedSuppliers() {
  return useLoadable(() => fetchVerifiedSuppliers(), [], 120_000);
}

/** Featured products, reloaded every 30 seconds so the section always reflects the database. */
export function useFeaturedProducts(categoryKey: string | null, categoryIds: string[] | null) {
  return useLoadable(() => fetchFeaturedProducts({ categoryIds, limit: 24 }), [categoryKey], 30_000);
}

export function useLiveRequirements(limit = 6, newerThanMs?: number) {
  return useLoadable(() => fetchLiveRequirements({ limit, newerThanMs }), [limit, newerThanMs], 45_000);
}

export function useAuctions(tab: AuctionTab, limit = 3) {
  return useLoadable(() => fetchAuctions(tab, limit), [tab, limit], 30_000);
}
