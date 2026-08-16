import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapUser} from '@api/mappers';

export async function updateAvatar(url: string) {
  const {data} = await apiClient.patch(ENDPOINTS.USERS.AVATAR, {url});
  return mapUser(data);
}
