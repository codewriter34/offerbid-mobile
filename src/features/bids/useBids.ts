import {useCallback} from 'react';
import {useBidStore} from './bidStore';
import {CreateBidPayload, CounterRespondPayload, RespondBidPayload} from '@shared/types';
import * as bidService from './bidService';

export function useBids() {
  const store = useBidStore();

  const fetchMyBids = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      store.setMyBids(await bidService.fetchMyBids());
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
      store.setIncomingBids(await bidService.fetchIncomingBids());
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load incoming bids');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const fetchListingBids = useCallback(async (listingId: string) => {
    try {
      const bids = await bidService.fetchListingBids(listingId);
      store.setListingBids(listingId, bids);
      return bids;
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load bids');
      return [];
    }
  }, []);

  const submitBid = useCallback(async (payload: CreateBidPayload) => {
    store.setLoading(true);
    store.setError(null);
    try {
      const bid = await bidService.createBid(payload);
      store.addBid(bid);
      return bid;
    } catch (err: any) {
      const message = err.response?.data?.message ?? 'Failed to submit bid';
      store.setError(message);
      throw new Error(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      store.setLoading(false);
    }
  }, []);

  const respondToBid = useCallback(
    async (bidId: string, payload: RespondBidPayload) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const next = await bidService.respondToBid(bidId, payload);
        store.updateBid(bidId, next);
        return next;
      } catch (err: any) {
        const message = err.response?.data?.message ?? 'Failed to update bid';
        store.setError(message);
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
      } finally {
        store.setLoading(false);
      }
    },
    [],
  );

  const respondToCounter = useCallback(
    async (bidId: string, payload: CounterRespondPayload) => {
      store.setLoading(true);
      store.setError(null);
      try {
        const next = await bidService.respondToCounter(bidId, payload);
        store.updateBid(bidId, next);
        return next;
      } catch (err: any) {
        const message = err.response?.data?.message ?? 'Failed to update bid';
        store.setError(message);
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
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
    respondToBid,
    respondToCounter,
  };
}
