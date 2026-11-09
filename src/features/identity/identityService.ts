import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapIdentity} from '@api/mappers';
import {SubmitIdentityPayload} from '@shared/types';

export async function fetchIdentity() {
  const {data} = await apiClient.get(ENDPOINTS.IDENTITY.ME);
  return mapIdentity(data);
}

export async function submitIdentity(payload: SubmitIdentityPayload) {
  const {data} = await apiClient.post(ENDPOINTS.IDENTITY.SUBMIT, payload);
  return mapIdentity(data);
}
