import {create} from 'zustand';
import {Bid} from '@shared/types';
import {mergeBid} from './bidService';

interface BidState {
  myBids: Bid[];
  incomingBids: Bid[];
  listingBids: Record<string, Bid[]>;
  isLoading: boolean;
  error: string | null;

  setMyBids: (bids: Bid[]) => void;
  setIncomingBids: (bids: Bid[]) => void;
  setListingBids: (listingId: string, bids: Bid[]) => void;
  updateBid: (bidId: string, partial: Partial<Bid>) => void;
  addBid: (bid: Bid) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useBidStore = create<BidState>(set => ({
  myBids: [],
  incomingBids: [],
  listingBids: {},
  isLoading: false,
  error: null,

  setMyBids: myBids => set({myBids}),
  setIncomingBids: incomingBids => set({incomingBids}),
  setListingBids: (listingId, bids) =>
    set(state => ({
      listingBids: {...state.listingBids, [listingId]: bids},
    })),

  updateBid: (bidId, partial) =>
    set(state => {
      const update = (list: Bid[]) =>
        list.map(b => (b.id === bidId ? mergeBid(b, partial) : b));
      const updatedListingBids = {...state.listingBids};
      for (const key of Object.keys(updatedListingBids)) {
        updatedListingBids[key] = update(updatedListingBids[key]);
      }
      return {
        myBids: update(state.myBids),
        incomingBids: update(state.incomingBids),
        listingBids: updatedListingBids,
      };
    }),

  addBid: bid =>
    set(state => {
      const sameOffer = (item: Bid) =>
        item.id === bid.id || (bid.listingId && item.listingId === bid.listingId);
      const merge = (list: Bid[]) =>
        list.some(sameOffer)
          ? list.map(item => (sameOffer(item) ? mergeBid(item, bid) : item))
          : [bid, ...list];

      const listingBids = {...state.listingBids};
      listingBids[bid.listingId] = merge(listingBids[bid.listingId] ?? []);
      return {
        myBids: merge(state.myBids),
        listingBids,
      };
    }),

  setLoading: isLoading => set({isLoading}),
  setError: error => set({error}),
  reset: () =>
    set({
      myBids: [],
      incomingBids: [],
      listingBids: {},
      isLoading: false,
      error: null,
    }),
}));
