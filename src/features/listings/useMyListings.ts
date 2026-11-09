import {useCallback} from 'react';
import {useListingStore} from './listingStore';
import {fetchMyListings as fetchMyListingsApi} from './listingService';

export function useMyListings() {
  const store = useListingStore();

  const fetchMyListings = useCallback(async () => {
    try {
      store.setMyListings(await fetchMyListingsApi());
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load your listings');
    }
  }, []);

  return {
    myListings: store.myListings,
    error: store.error,
    fetchMyListings,
  };
}
