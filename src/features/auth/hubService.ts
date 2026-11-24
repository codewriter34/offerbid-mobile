import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapHubs, mapUser} from '@api/mappers';
import {getAppLocale, AppLocale} from '@shared/lib/locale';
import {HubsResponse} from '@shared/types/hub';

export async function fetchHubsCatalog(
  locale: AppLocale = getAppLocale(),
): Promise<HubsResponse> {
  const {data} = await apiClient.get(ENDPOINTS.HUBS.LIST, {
    params: {locale},
  });
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
  const {data} = await apiClient.patch(ENDPOINTS.USERS.COMPLETE_PROFILE, {
    ...payload,
    locale: getAppLocale(),
  });
  return mapUser(data);
}
