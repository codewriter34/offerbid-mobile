import {useCallback} from 'react';
import {useListingStore} from './listingStore';
import {fetchFeed, PAGE_SIZE} from './listingService';

export function useFeed() {
  const store = useListingStore();

  const buildParams = (page: number) => {
    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      status: 'ACTIVE',
    };
    if (store.filters.category) params.category = store.filters.category;
    const search = store.filters.search.trim();
    if (search.length >= 2) params.q = search;
    return params;
  };

  const fetchListings = useCallback(
    async (refresh = false) => {
      if (refresh) {
        store.setRefreshing(true);
        store.setPage(1);
        store.setHasMore(true);
      } else {
        store.setLoading(true);
      }
      store.setError(null);

      try {
        const page = refresh ? 1 : store.page;
        const items = await fetchFeed(buildParams(page));
        if (refresh || page === 1) {
          store.setListings(items);
        } else {
          store.appendListings(items);
        }
        store.setHasMore(items.length === PAGE_SIZE);
      } catch (err: any) {
        store.setError(err.response?.data?.message ?? 'Failed to load listings');
      } finally {
        store.setLoading(false);
        store.setRefreshing(false);
      }
    },
    [store.page, store.filters],
  );

  const loadMore = useCallback(async () => {
    if (store.isLoadingMore || !store.hasMore) return;
    store.setLoadingMore(true);
    const nextPage = store.page + 1;
    store.setPage(nextPage);
    try {
      const items = await fetchFeed(buildParams(nextPage));
      store.appendListings(items);
      store.setHasMore(items.length === PAGE_SIZE);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load more');
    } finally {
      store.setLoadingMore(false);
    }
  }, [store.page, store.hasMore, store.isLoadingMore, store.filters]);

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
