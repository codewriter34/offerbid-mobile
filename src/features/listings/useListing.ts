import {useCallback, useState} from 'react';
import {useListingStore} from './listingStore';
import {CreateListingPayload, UpdateListingPayload, ListingStatus, Listing} from '@shared/types';
import {
  contactSeller as contactSellerApi,
  createListing as createListingApi,
  deleteListing as deleteListingApi,
  fetchListing,
  fetchSimilarListings as fetchSimilarListingsApi,
  incrementViewCount as incrementViewCountApi,
  reportListing as reportListingApi,
  updateListing as updateListingApi,
  updateListingStatus as updateListingStatusApi,
} from './listingService';

export function useListing() {
  const store = useListingStore();
  const [similarListings, setSimilarListings] = useState<Listing[]>([]);

  const fetchListingById = useCallback(async (id: string) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const listing = await fetchListing(id);
      store.setCurrentListing(listing);
      return listing;
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load listing');
      return null;
    } finally {
      store.setLoading(false);
    }
  }, []);

  const createListing = useCallback(
    async (payload: CreateListingPayload) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const listing = await createListingApi(payload);
        store.setMyListings([listing, ...store.myListings]);
        return listing;
      } catch (err: any) {
        const message = err.response?.data?.message ?? 'Failed to create listing';
        store.setError(message);
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        store.setLoading(false);
      }
    },
    [store.myListings],
  );

  const updateListingStatus = useCallback(async (id: string, status: ListingStatus) => {
    const listing = await updateListingStatusApi(id, status);
    store.updateListing(id, listing);
    return listing;
  }, []);

  const contactSeller = useCallback(async (id: string) => {
    return contactSellerApi(id);
  }, []);

  const updateListing = useCallback(async (id: string, payload: UpdateListingPayload) => {
    const listing = await updateListingApi(id, payload);
    store.updateListing(id, listing);
    return listing;
  }, []);

  const deleteListing = useCallback(async (id: string) => {
    await deleteListingApi(id);
    store.removeListing(id);
    store.setCurrentListing(null);
  }, []);

  const incrementViewCount = useCallback(async (id: string) => {
    try {
      await incrementViewCountApi(id);
      store.updateListing(id, {
        viewCount: (store.currentListing?.viewCount ?? 0) + 1,
      });
    } catch {
      // Fire-and-forget; view tracking should not block UI
    }
  }, [store.currentListing?.viewCount]);

  const fetchSimilarListings = useCallback(async (id: string) => {
    try {
      const listings = await fetchSimilarListingsApi(id);
      setSimilarListings(listings);
      return listings;
    } catch {
      setSimilarListings([]);
      return [];
    }
  }, []);

  const reportListing = useCallback(async (listingId: string, reason: string) => {
    await reportListingApi(listingId, reason);
  }, []);

  return {
    currentListing: store.currentListing,
    similarListings,
    isLoading: store.isLoading,
    error: store.error,
    fetchListingById,
    createListing,
    updateListing,
    deleteListing,
    updateListingStatus,
    incrementViewCount,
    fetchSimilarListings,
    contactSeller,
    reportListing,
    setCurrentListing: store.setCurrentListing,
  };
}
