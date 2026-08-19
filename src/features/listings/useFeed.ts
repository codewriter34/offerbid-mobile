import {useCallback, useRef} from 'react';
import {useListingStore} from './listingStore';
import {fetchFeed, PAGE_SIZE} from './listingService';
import {
  FEED_CACHE_FRESH_MS,
  feedCacheKey,
  getCachedFeed,
  persistFeedPage,
} from '@shared/lib/feedStorage';

export function useFeed() {
  const store = useListingStore();
  const requestRef = useRef(0);

  const buildParams = (page: number, filters: typeof store.filters) => {
    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      status: 'ACTIVE',
    };
    if (filters.category) params.category = filters.category;
    const search = filters.search.trim();
    if (search.length >= 2) params.q = search;
    return params;
  };

  const fetchListings = useCallback(async (refresh = false) => {
    const current = useListingStore.getState();
    const filters = current.filters;
    const key = feedCacheKey(filters);
    const requestId = ++requestRef.current;

    if (!refresh) {
      const cached = await getCachedFeed(key);
      if (requestId !== requestRef.current) return;
      if (cached) {
        current.setListings(cached.listings);
        current.setHasMore(cached.hasMore);
        current.setPage(1);
        current.setError(null);
        if (Date.now() - cached.savedAt < FEED_CACHE_FRESH_MS) {
          return;
        }
      } else if (useListingStore.getState().feedKey !== key) {
        current.setListings([]);
        current.setHasMore(true);
        current.setPage(1);
      }
    }

    const hasData = useListingStore.getState().listings.length > 0;
    if (refresh) {
      current.setRefreshing(true);
      current.setPage(1);
      current.setHasMore(true);
    } else if (!hasData) {
      current.setLoading(true);
    }
    if (!hasData) current.setError(null);

    try {
      const items = await fetchFeed(buildParams(1, filters));
      if (requestId !== requestRef.current) return;
      if (feedCacheKey(useListingStore.getState().filters) !== key) return;
      current.setListings(items);
      current.setHasMore(items.length === PAGE_SIZE);
      current.setPage(1);
      current.setError(null);
      persistFeedPage(filters, items, items.length === PAGE_SIZE);
    } catch (err: any) {
      if (requestId !== requestRef.current) return;
      if (useListingStore.getState().listings.length === 0) {
        current.setError(err.response?.data?.message ?? 'Failed to load listings');
      }
    } finally {
      if (requestId === requestRef.current) {
        current.setLoading(false);
        current.setRefreshing(false);
      }
    }
  }, []);

  const loadMore = useCallback(async () => {
    const current = useListingStore.getState();
    if (current.isLoadingMore || !current.hasMore) return;
    current.setLoadingMore(true);
    const nextPage = current.page + 1;
    current.setPage(nextPage);
    const filters = current.filters;
    const key = feedCacheKey(filters);
    try {
      const items = await fetchFeed(buildParams(nextPage, filters));
      if (feedCacheKey(useListingStore.getState().filters) !== key) return;
      current.appendListings(items);
      current.setHasMore(items.length === PAGE_SIZE);
    } catch (err: any) {
      current.setError(err.response?.data?.message ?? 'Failed to load more');
    } finally {
      current.setLoadingMore(false);
    }
  }, []);

  return {
    listings: store.listings,
    filters: store.filters,
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    isLoadingMore: store.isLoadingMore,
    hasMore: store.hasMore,
    error: store.error,
    fetchListings,
    loadMore,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
  };
}
