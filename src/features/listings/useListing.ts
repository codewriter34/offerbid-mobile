import {useCallback} from 'react';
import {useListingStore} from './listingStore';
import {CreateListingPayload, ListingStatus} from '@shared/types';
import {
  contactSeller as contactSellerApi,
  createListing as createListingApi,
  fetchListing,
  reportListing as reportListingApi,
  updateListingStatus as updateListingStatusApi,
} from './listingService';

export function useListing() {
  const store = useListingStore();

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

  const reportListing = useCallback(async (listingId: string, reason: string) => {
    await reportListingApi(listingId, reason);
  }, []);

  return {
    currentListing: store.currentListing,
    isLoading: store.isLoading,
    error: store.error,
    fetchListingById,
    createListing,
    updateListingStatus,
    contactSeller,
    reportListing,
    setCurrentListing: store.setCurrentListing,
  };
}
