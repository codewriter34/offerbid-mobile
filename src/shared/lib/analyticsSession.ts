import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import {Platform} from 'react-native';
import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';

const ANON_ID_KEY = 'offerbid.analytics.anonymousId';

async function getOrCreateAnonymousId(): Promise<string> {
  let id = await SecureStore.getItemAsync(ANON_ID_KEY);
  if (!id) {
    id = uuidv4();
    await SecureStore.setItemAsync(ANON_ID_KEY, id);
  }
  return id;
}

export async function recordAppOpen(): Promise<void> {
  try {
    const platform = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    const anonymousId = await getOrCreateAnonymousId();
    await apiClient.post(
      ENDPOINTS.ANALYTICS.SESSION,
      {platform, anonymousId},
      {headers: {'X-Client-Platform': platform}},
    );
  } catch {
    // Non-blocking — analytics failures must not affect UX
  }
}
