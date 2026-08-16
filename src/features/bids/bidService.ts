import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapBid, mapBids, mapListings} from '@api/mappers';
import {extractWhatsAppUrl, listingImageUrl} from '@api/normalize';
import {
  Bid,
  CreateBidPayload,
  CounterRespondPayload,
  Listing,
  RespondBidPayload,
} from '@shared/types';

function withListing(bid: Bid, listing: Listing): Bid {
  return {
    ...bid,
    listingId: bid.listingId || listing.id,
    listingTitle: bid.listingTitle ?? listing.title,
    listingImageUrl: bid.listingImageUrl ?? listingImageUrl(listing) ?? null,
    listingCategory: bid.listingCategory ?? listing.category,
    minBidPrice: bid.minBidPrice ?? listing.minBidPrice,
    askingPrice: bid.askingPrice ?? listing.askingPrice,
    currency: bid.currency ?? listing.currency,
  };
}

export async function fetchMyBids() {
  const {data} = await apiClient.get(ENDPOINTS.BIDS.MY_BIDS);
  return mapBids(data);
}

export async function fetchIncomingBids() {
  const {data} = await apiClient.get(ENDPOINTS.LISTINGS.MY_LISTINGS);
  const listings = mapListings(data);
  const groups = await Promise.all(
    listings.map(async listing => {
      const res = await apiClient.get(ENDPOINTS.BIDS.LISTING_BIDS(listing.id));
      return mapBids(res.data, listing.title).map(bid => withListing(bid, listing));
    }),
  );
  return groups.flat();
}

export async function fetchListingBids(listingId: string) {
  const {data} = await apiClient.get(ENDPOINTS.BIDS.LISTING_BIDS(listingId));
  return mapBids(data);
}

export async function createBid(payload: CreateBidPayload) {
  const {data} = await apiClient.post(ENDPOINTS.BIDS.CREATE, payload);
  return mapBid(data);
}

export async function respondToBid(bidId: string, payload: RespondBidPayload) {
  const {data} = await apiClient.patch(ENDPOINTS.BIDS.RESPOND(bidId), payload);
  const bid = mapBid(data);
  return {...bid, whatsappUrl: extractWhatsAppUrl(data) ?? bid.whatsappUrl};
}

export async function respondToCounter(bidId: string, payload: CounterRespondPayload) {
  const {data} = await apiClient.patch(ENDPOINTS.BIDS.COUNTER_RESPOND(bidId), payload);
  const bid = mapBid(data);
  return {...bid, whatsappUrl: extractWhatsAppUrl(data) ?? bid.whatsappUrl};
}
