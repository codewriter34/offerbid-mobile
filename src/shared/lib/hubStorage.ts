import * as SecureStore from 'expo-secure-store';
import {withTimeout} from '@shared/lib/withTimeout';
import {HubsResponse} from '@shared/types/hub';

const KEY = 'offerbid.hubsCatalog';
const STORE_TIMEOUT_MS = 2500;

export async function getCachedHubs(): Promise<HubsResponse | null> {
  const raw = await withTimeout(
    SecureStore.getItemAsync(KEY).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HubsResponse;
    if (!parsed || !Array.isArray(parsed.categories)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedHubs(catalog: HubsResponse): Promise<void> {
  try {
    await withTimeout(
      SecureStore.setItemAsync(KEY, JSON.stringify(catalog))
        .then(() => true)
        .catch(() => false),
      STORE_TIMEOUT_MS,
      false,
    );
  } catch {
    // Cache is optional; in-memory store still holds the latest fetch.
  }
}
