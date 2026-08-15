import {useCallback} from 'react';
import {useBidStore} from '../store/bidStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {Bid, CreateBidPayload, RespondBidPayload, CounterRespondPayload} from '../types';
import {extractWhatsAppUrl} from '../utils/apiNormalize';
import {mapBid, mapBids, mapListings} from '../utils/mappers';

export function useBids() {
  const store = useBidStore();

  const fetchMyBids = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get(ENDPOINTS.BIDS.MY_BIDS);
      store.setMyBids(mapBids(data));
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
      const {data} = await apiClient.get(ENDPOINTS.LISTINGS.MY_LISTINGS);
      const listings = mapListings(data);
      const groups = await Promise.all(
        listings.map(async listing => {
          const res = await apiClient.get(ENDPOINTS.BIDS.LISTING_BIDS(listing.id));
          return mapBids(res.data, listing.title);
        }),
      );
      store.setIncomingBids(groups.flat());
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
      const {data} = await apiClient.get(ENDPOINTS.BIDS.LISTING_BIDS(listingId));
      const bids = mapBids(data);
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
      const {data} = await apiClient.post(ENDPOINTS.BIDS.CREATE, payload);
      const bid = mapBid(data);
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
        const {data} = await apiClient.patch(ENDPOINTS.BIDS.RESPOND(bidId), payload);
        const bid = mapBid(data);
        const whatsappUrl = extractWhatsAppUrl(data) ?? bid.whatsappUrl;
        const next = {...bid, whatsappUrl};
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
        const {data} = await apiClient.patch(
          ENDPOINTS.BIDS.COUNTER_RESPOND(bidId),
          payload,
        );
        const bid = mapBid(data);
        const whatsappUrl = extractWhatsAppUrl(data) ?? bid.whatsappUrl;
        const next = {...bid, whatsappUrl};
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
