import { useCallback, useEffect, useState } from 'react';
import {
  fetchFeaturedProducts,
  fetchLiveAuctions,
  fetchLiveRequirements,
  fetchMarketplaceOverview,
  fetchTopCategories,
  fetchVerifiedManufacturers,
} from '@/lib/homepageData';

export interface LoadState<T> {
  data: T | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

/** Runs a loader on mount and again on retry. Results that arrive after unmount are ignored. */
function useLoadable<T>(loader: () => Promise<T>): LoadState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setFailed(false);
    loader()
      .then((result) => {
        if (active) setData(result);
      })
      .catch(() => {
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [attempt, loader]);

  const retry = useCallback(() => setAttempt((count) => count + 1), []);

  return { data, loading, failed, retry };
}

export function useMarketplaceOverview() {
  return useLoadable(fetchMarketplaceOverview);
}

export function useTopCategories() {
  return useLoadable(fetchTopCategories);
}

export function useFeaturedProducts() {
  return useLoadable(fetchFeaturedProducts);
}

export function useVerifiedManufacturers() {
  return useLoadable(fetchVerifiedManufacturers);
}

export function useLiveRequirements() {
  return useLoadable(fetchLiveRequirements);
}

export function useLiveAuctions() {
  return useLoadable(fetchLiveAuctions);
}
