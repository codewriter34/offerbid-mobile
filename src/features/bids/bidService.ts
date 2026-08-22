import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapBid, mapBids, mapListings} from '@api/mappers';
import {extractWhatsAppUrl, listingImageUrl} from '@api/normalize';
import {findCachedListing, useListingStore} from '@features/listings/listingStore';
import {fetchListing} from '@features/listings/listingService';
import {
  Bid,
  CreateBidPayload,
  CounterRespondPayload,
  Listing,
  RespondBidPayload,
} from '@shared/types';

export function withListing(bid: Bid, listing: Listing): Bid {
  return {
    ...bid,
    listingId: bid.listingId || listing.id,
    listingTitle: bid.listingTitle || listing.title,
    listingImageUrl: bid.listingImageUrl || listingImageUrl(listing) || null,
    listingCategory: bid.listingCategory || listing.category,
    minBidPrice: bid.minBidPrice ?? listing.minBidPrice,
    askingPrice: bid.askingPrice ?? listing.askingPrice,
    currency: bid.currency || listing.currency,
  };
}

export function mergeBid(current: Bid, incoming: Partial<Bid>): Bid {
  return {
    ...current,
    ...incoming,
    listingTitle: incoming.listingTitle || current.listingTitle,
    listingImageUrl: incoming.listingImageUrl || current.listingImageUrl,
    listingCategory: incoming.listingCategory || current.listingCategory,
    buyerName: incoming.buyerName || current.buyerName,
    buyerAvatarUrl: incoming.buyerAvatarUrl || current.buyerAvatarUrl,
    currency: incoming.currency || current.currency,
    minBidPrice: incoming.minBidPrice ?? current.minBidPrice,
    askingPrice: incoming.askingPrice ?? current.askingPrice,
    whatsappUrl: incoming.whatsappUrl || current.whatsappUrl,
  };
}

function needsListingMedia(bid: Bid): boolean {
  return Boolean(bid.listingId) && (!bid.listingImageUrl || !bid.listingTitle);
}

async function resolveListing(id: string): Promise<Listing | null> {
  const cached = findCachedListing(id);
  if (cached) return cached;
  try {
    const listing = await fetchListing(id);
    useListingStore.getState().upsertListing(listing);
    return listing;
  } catch {
    return null;
  }
}

export async function hydrateBids(bids: Bid[]): Promise<Bid[]> {
  const missingIds = [
    ...new Set(bids.filter(needsListingMedia).map(bid => bid.listingId).filter(Boolean)),
  ];
  const resolved = new Map<string, Listing>();
  await Promise.all(
    missingIds.map(async id => {
      const listing = await resolveListing(id);
      if (listing) resolved.set(id, listing);
    }),
  );
  return bids.map(bid => {
    const listing = findCachedListing(bid.listingId) ?? resolved.get(bid.listingId);
    return listing ? withListing(bid, listing) : bid;
  });
}

export async function fetchMyBids() {
  const {data} = await apiClient.get(ENDPOINTS.BIDS.MY_BIDS);
  return hydrateBids(mapBids(data));
}

export async function fetchIncomingBids() {
  const {data} = await apiClient.get(ENDPOINTS.LISTINGS.MY_LISTINGS);
  const listings = mapListings(data);
  useListingStore.getState().setMyListings(listings);
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
  const listing = findCachedListing(listingId);
  const bids = mapBids(data, listing?.title);
  return listing ? bids.map(bid => withListing(bid, listing)) : hydrateBids(bids);
}

export async function createBid(payload: CreateBidPayload) {
  const {data} = await apiClient.post(ENDPOINTS.BIDS.CREATE, payload);
  const listing = findCachedListing(payload.listingId);
  const bid = listing ? withListing(mapBid(data), listing) : mapBid(data);
  if (bid.listingImageUrl) return bid;
  const [hydrated] = await hydrateBids([bid]);
  return hydrated;
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
