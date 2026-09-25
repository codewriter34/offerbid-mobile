import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';
import {UpdateProfilePayload, User} from '../types';

export async function updateProfile(payload: UpdateProfilePayload): Promise<User> {
  const {data} = await apiClient.patch<User>(ENDPOINTS.USERS.UPDATE, payload);
  return data;
}
