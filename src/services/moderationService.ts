import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';

export async function reportContent(input: {
  listingId?: string;
  reportedUserId?: string;
  reason: string;
}) {
  const {data} = await apiClient.post(ENDPOINTS.REPORTS.CREATE, input);
  return data;
}

export async function blockUser(userId: string) {
  const {data} = await apiClient.post(ENDPOINTS.USERS.BLOCK(userId));
  return data;
}

export async function deleteAccount() {
  const {data} = await apiClient.delete(ENDPOINTS.USERS.DELETE);
  return data;
}

export async function updateWhatsApp(phone: string, countryCode = '+237') {
  const {data} = await apiClient.patch(ENDPOINTS.USERS.UPDATE, {
    phone,
    countryCode,
  });
  return data;
}
