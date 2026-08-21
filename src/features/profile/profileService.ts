import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapUser, mapPublicProfile} from '@api/mappers';
import {UpdateProfilePayload} from '@shared/types';

export async function updateAvatar(url: string) {
  const {data} = await apiClient.patch(ENDPOINTS.USERS.AVATAR, {url});
  return mapUser(data);
}

export async function updateProfile(payload: UpdateProfilePayload) {
  const {data} = await apiClient.patch(ENDPOINTS.USERS.ME, payload);
  return mapUser(data);
}

export async function fetchPublicProfile(userId: string) {
  const {data} = await apiClient.get(ENDPOINTS.USERS.PUBLIC_PROFILE(userId));
  return mapPublicProfile(data);
}
