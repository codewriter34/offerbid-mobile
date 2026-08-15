import {useCallback} from 'react';
import {useListingStore} from '../store/listingStore';
import {useAuthStore} from '../store/authStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {Listing, CreateListingPayload} from '../types';

const PAGE_SIZE = 20;

export function useListings() {
  const store = useListingStore();
  const user = useAuthStore(s => s.user);

  const fetchListings = useCallback(
    async (refresh = false) => {
      if (!user?.hub_id) return;

      if (refresh) {
        store.setRefreshing(true);
        store.setPage(1);
        store.setHasMore(true);
      } else {
        store.setLoading(true);
      }
      store.setError(null);

      try {
        const params: Record<string, unknown> = {
          hub_id: user.hub_id,
          page: refresh ? 1 : store.page,
          limit: PAGE_SIZE,
          sort: store.filters.sortBy,
        };
        if (store.filters.category) params.category = store.filters.category;
        if (store.filters.minPrice != null)
          params.min_price = store.filters.minPrice;
        if (store.filters.maxPrice != null)
          params.max_price = store.filters.maxPrice;
        if (store.filters.search) params.search = store.filters.search;

        const {data} = await apiClient.get<{
          items: Listing[];
          total: number;
        }>(ENDPOINTS.LISTINGS.LIST, {params});

        if (refresh || store.page === 1) {
          store.setListings(data.items);
        } else {
          store.appendListings(data.items);
        }
        store.setHasMore(data.items.length === PAGE_SIZE);
      } catch (err: any) {
        store.setError(err.response?.data?.message ?? 'Failed to load listings');
      } finally {
        store.setLoading(false);
        store.setRefreshing(false);
      }
    },
    [user?.hub_id, store.page, store.filters],
  );

  const loadMore = useCallback(async () => {
    if (store.isLoadingMore || !store.hasMore) return;
    store.setLoadingMore(true);
    store.setPage(store.page + 1);
    try {
      const params: Record<string, unknown> = {
        hub_id: user?.hub_id,
        page: store.page + 1,
        limit: PAGE_SIZE,
        sort: store.filters.sortBy,
      };
      if (store.filters.category) params.category = store.filters.category;
      if (store.filters.minPrice != null)
        params.min_price = store.filters.minPrice;
      if (store.filters.maxPrice != null)
        params.max_price = store.filters.maxPrice;
      if (store.filters.search) params.search = store.filters.search;

      const {data} = await apiClient.get<{items: Listing[]; total: number}>(
        ENDPOINTS.LISTINGS.LIST,
        {params},
      );
      store.appendListings(data.items);
      store.setHasMore(data.items.length === PAGE_SIZE);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load more');
    } finally {
      store.setLoadingMore(false);
    }
  }, [user?.hub_id, store.page, store.hasMore, store.isLoadingMore, store.filters]);

  const fetchListingById = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get<Listing>(ENDPOINTS.LISTINGS.DETAIL(id));
      store.setCurrentListing(data);
      return data;
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load listing');
      return null;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    try {
      const {data} = await apiClient.get<Listing[]>(ENDPOINTS.LISTINGS.MY_LISTINGS);
      store.setMyListings(data);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load your listings');
    }
  }, []);

  const createListing = useCallback(
    async (payload: CreateListingPayload) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const {data} = await apiClient.post<Listing>(
          ENDPOINTS.LISTINGS.CREATE,
          payload,
        );
        store.setMyListings([data, ...store.myListings]);
        return data;
      } catch (err: any) {
        const message =
          err.response?.data?.message ?? 'Failed to create listing';
        store.setError(message);
        throw new Error(message);
      } finally {
        store.setLoading(false);
      }
    },
    [store.myListings],
  );

  return {
    listings: store.listings,
    myListings: store.myListings,
    currentListing: store.currentListing,
    filters: store.filters,
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    isLoadingMore: store.isLoadingMore,
    hasMore: store.hasMore,
    error: store.error,
    fetchListings,
    loadMore,
    fetchListingById,
    fetchMyListings,
    createListing,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    setCurrentListing: store.setCurrentListing,
  };
}
