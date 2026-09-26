import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapUser, mapPublicProfile} from '@api/mappers';
import {getRefreshToken, clearTokens} from '@shared/lib/tokenStorage';
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

export async function deleteAccount(password?: string) {
  const refreshToken = await getRefreshToken();
  await apiClient.delete(ENDPOINTS.USERS.ME, {
    data: {
      ...(password ? {password} : {}),
      ...(refreshToken ? {refreshToken} : {}),
    },
  });
  await clearTokens();
}

export async function blockUser(userId: string) {
  const {data} = await apiClient.post(ENDPOINTS.USERS.BLOCK(userId));
  return data;
}
