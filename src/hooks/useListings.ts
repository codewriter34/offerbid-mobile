import {useCallback} from 'react';
import {useListingStore} from '../store/listingStore';
import {useAuthStore} from '../store/authStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {Listing, CreateListingPayload, ListingStatus} from '../types';
import {extractWhatsAppUrl} from '../utils/apiNormalize';
import {mapListing, mapListings} from '../utils/mappers';

const PAGE_SIZE = 20;

export function useListings() {
  const store = useListingStore();
  const user = useAuthStore(s => s.user);

  const buildFeedParams = (page: number) => {
    const params: Record<string, unknown> = {
      page,
      limit: PAGE_SIZE,
      status: 'ACTIVE',
    };
    if (user?.city) params.city = user.city;
    if (user?.location) params.location = user.location;
    if (store.filters.category) params.category = store.filters.category;
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
        const search = store.filters.search.trim();
        const params = {
          ...buildFeedParams(page),
          ...(search.length >= 2 ? {q: search} : {}),
        };
        const path = search.length >= 2 ? ENDPOINTS.SEARCH : ENDPOINTS.LISTINGS.LIST;
        const {data} = await apiClient.get(path, {params});
        const items = mapListings(data);

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
    [user?.city, user?.location, store.page, store.filters],
  );

  const loadMore = useCallback(async () => {
    if (store.isLoadingMore || !store.hasMore) return;
    store.setLoadingMore(true);
    const nextPage = store.page + 1;
    store.setPage(nextPage);
    try {
      const search = store.filters.search.trim();
      const params = {
        ...buildFeedParams(nextPage),
        ...(search.length >= 2 ? {q: search} : {}),
      };
      const path = search.length >= 2 ? ENDPOINTS.SEARCH : ENDPOINTS.LISTINGS.LIST;
      const {data} = await apiClient.get(path, {params});
      const items = mapListings(data);
      store.appendListings(items);
      store.setHasMore(items.length === PAGE_SIZE);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load more');
    } finally {
      store.setLoadingMore(false);
    }
  }, [user?.city, user?.location, store.page, store.hasMore, store.isLoadingMore, store.filters]);

  const fetchListingById = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get(ENDPOINTS.LISTINGS.DETAIL(id));
      const listing = mapListing(data);
      store.setCurrentListing(listing);
      return listing;
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load listing');
      return null;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchMyListings = useCallback(async () => {
    try {
      const {data} = await apiClient.get(ENDPOINTS.LISTINGS.MY_LISTINGS);
      store.setMyListings(mapListings(data));
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
        const listing = mapListing(data);
        store.setMyListings([listing, ...store.myListings]);
        return listing;
      } catch (err: any) {
        const message =
          err.response?.data?.message ?? 'Failed to create listing';
        store.setError(message);
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        store.setLoading(false);
      }
    },
    [store.myListings],
  );

  const updateListingStatus = useCallback(
    async (id: string, status: ListingStatus) => {
      const {data} = await apiClient.patch(ENDPOINTS.LISTINGS.STATUS(id), {status});
      const listing = mapListing(data);
      store.updateListing(id, listing);
      return listing;
    },
    [],
  );

  const contactSeller = useCallback(async (id: string) => {
    const {data} = await apiClient.post(ENDPOINTS.LISTINGS.CONTACT(id));
    const url = extractWhatsAppUrl(data);
    if (!url) throw new Error('No WhatsApp link returned');
    return url;
  }, []);

  const reportListing = useCallback(async (listingId: string, reason: string) => {
    await apiClient.post(ENDPOINTS.REPORTS, {listingId, reason});
  }, []);

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
    updateListingStatus,
    contactSeller,
    reportListing,
    setFilters: store.setFilters,
    resetFilters: store.resetFilters,
    setCurrentListing: store.setCurrentListing,
  };
}
