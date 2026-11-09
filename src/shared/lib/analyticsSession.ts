import {AppState, Platform} from 'react-native';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';

const ANON_ID_KEY = 'offerbid.analytics.anonymousId';

let trackingStarted = false;
let coldStartRecorded = false;

function clientPlatform(): 'IOS' | 'ANDROID' | null {
  if (Platform.OS === 'ios') return 'IOS';
  if (Platform.OS === 'android') return 'ANDROID';
  return null;
}

async function getOrCreateAnonymousId(): Promise<string> {
  let id = await SecureStore.getItemAsync(ANON_ID_KEY);
  if (!id) {
    id = Crypto.randomUUID();
    await SecureStore.setItemAsync(ANON_ID_KEY, id);
  }
  return id;
}

/** POST /api/v1/analytics/session. Failures stay silent so they never block the app. */
export async function recordAppOpen(): Promise<void> {
  const platform = clientPlatform();
  if (!platform) return;
  try {
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

/** Cold start is recorded by the caller after auth restore. This only counts later resumes. */
export function startAppOpenTracking(): void {
  if (trackingStarted) return;
  trackingStarted = true;
  let appState = AppState.currentState;
  AppState.addEventListener('change', nextState => {
    const becameActive = appState !== 'active' && nextState === 'active';
    appState = nextState;
    if (becameActive && coldStartRecorded) {
      void recordAppOpen();
    }
  });
}

export async function recordColdStart(): Promise<void> {
  await recordAppOpen();
  coldStartRecorded = true;
}
