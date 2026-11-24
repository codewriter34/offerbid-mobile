import * as SecureStore from 'expo-secure-store';
import {withTimeout} from '@shared/lib/withTimeout';
import {AppLocale} from '@shared/lib/locale';
import {HubCategory, HubsResponse} from '@shared/types/hub';

const KEY = 'offerbid.hubsCatalog';
const STORE_TIMEOUT_MS = 2500;

export type CachedHubsCatalog = HubsResponse & {locale?: AppLocale};

function isValidCategory(item: unknown): item is HubCategory | string {
  if (typeof item === 'string') return item.length > 0;
  if (!item || typeof item !== 'object') return false;
  const value = (item as HubCategory).value;
  return typeof value === 'string' && value.length > 0;
}

export async function getCachedHubs(): Promise<CachedHubsCatalog | null> {
  const raw = await withTimeout(
    SecureStore.getItemAsync(KEY).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedHubsCatalog;
    if (!parsed || !Array.isArray(parsed.categories)) return null;
    if (!parsed.categories.every(isValidCategory)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedHubs(
  catalog: HubsResponse,
  locale?: AppLocale,
): Promise<void> {
  try {
    const payload: CachedHubsCatalog = locale ? {...catalog, locale} : catalog;
    await withTimeout(
      SecureStore.setItemAsync(KEY, JSON.stringify(payload))
        .then(() => true)
        .catch(() => false),
      STORE_TIMEOUT_MS,
      false,
    );
  } catch {
    // Cache is optional; in-memory store still holds the latest fetch.
  }
}
