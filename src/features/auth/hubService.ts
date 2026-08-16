import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapHubs, mapUser} from '@api/mappers';
import {HubsResponse} from '@shared/types/hub';

export async function fetchHubsCatalog(): Promise<HubsResponse> {
  const {data} = await apiClient.get(ENDPOINTS.HUBS.LIST);
  return mapHubs(data);
}

export async function fetchHubs() {
  return (await fetchHubsCatalog()).hubs;
}

export async function completeProfile(payload: {
  city: string;
  address: string;
  location: string;
}) {
  const {data} = await apiClient.patch(ENDPOINTS.USERS.COMPLETE_PROFILE, payload);
  return mapUser(data);
}
