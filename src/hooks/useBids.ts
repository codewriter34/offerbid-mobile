import {useCallback} from 'react';
import {useBidStore} from '../store/bidStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {Bid, CreateBidPayload, UpdateBidPayload} from '../types';

export function useBids() {
  const store = useBidStore();

  const fetchMyBids = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get<Bid[]>(ENDPOINTS.BIDS.MY_BIDS);
      store.setMyBids(data);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load your bids');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchIncomingBids = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get<Bid[]>('/bids/incoming');
      store.setIncomingBids(data);
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ?? 'Failed to load incoming bids',
      );
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchListingBids = useCallback(async (listingId: string) => {
    try {
      const {data} = await apiClient.get<Bid[]>(
        ENDPOINTS.BIDS.LISTING_BIDS(listingId),
      );
      store.setListingBids(listingId, data);
      return data;
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load bids');
      return [];
    }
  }, []);

  const submitBid = useCallback(async (payload: CreateBidPayload) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.post<Bid>(ENDPOINTS.BIDS.CREATE, payload);
      store.addBid(data);
      return data;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to submit bid';
      store.setError(message);
      throw new Error(message);
    } finally {
      store.setLoading(false);
    }
  }, []);

  const updateBid = useCallback(
    async (bidId: string, payload: UpdateBidPayload) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const {data} = await apiClient.patch<Bid>(
          ENDPOINTS.BIDS.UPDATE(bidId),
          payload,
        );
        store.updateBid(bidId, data);
        return data;
      } catch (err: any) {
        const message =
          err.response?.data?.message ?? 'Failed to update bid';
        store.setError(message);
        throw new Error(message);
      } finally {
        store.setLoading(false);
      }
    },
    [],
  );

  return {
    myBids: store.myBids,
    incomingBids: store.incomingBids,
    listingBids: store.listingBids,
    isLoading: store.isLoading,
    error: store.error,
    fetchMyBids,
    fetchIncomingBids,
    fetchListingBids,
    submitBid,
    updateBid,
  };
}
