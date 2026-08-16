import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapListing, mapListings} from '@api/mappers';
import {extractWhatsAppUrl} from '@api/normalize';
import {CreateListingPayload, ListingStatus} from '@shared/types';

export const PAGE_SIZE = 20;

export async function fetchFeed(params: Record<string, unknown>) {
  const search = typeof params.q === 'string' ? params.q : '';
  const path = search.length >= 2 ? ENDPOINTS.SEARCH : ENDPOINTS.LISTINGS.LIST;
  const {data} = await apiClient.get(path, {params});
  return mapListings(data);
}

export async function fetchListing(id: string) {
  const {data} = await apiClient.get(ENDPOINTS.LISTINGS.DETAIL(id));
  return mapListing(data);
}

export async function fetchMyListings() {
  const {data} = await apiClient.get(ENDPOINTS.LISTINGS.MY_LISTINGS);
  return mapListings(data);
}

export async function createListing(payload: CreateListingPayload) {
  const {data} = await apiClient.post(ENDPOINTS.LISTINGS.CREATE, payload);
  return mapListing(data);
}

export async function updateListingStatus(id: string, status: ListingStatus) {
  const {data} = await apiClient.patch(ENDPOINTS.LISTINGS.STATUS(id), {status});
  return mapListing(data);
}

export async function contactSeller(id: string) {
  const {data} = await apiClient.post(ENDPOINTS.LISTINGS.CONTACT(id));
  const url = extractWhatsAppUrl(data);
  if (!url) throw new Error('No WhatsApp link returned');
  return url;
}

export async function reportListing(listingId: string, reason: string) {
  await apiClient.post(ENDPOINTS.REPORTS, {listingId, reason});
}
