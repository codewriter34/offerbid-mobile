import AsyncStorage from '@react-native-async-storage/async-storage';
import {Listing} from '@shared/types';
import {withTimeout} from '@shared/lib/withTimeout';

const PREFIX = 'offerbid.feed.';
const STORE_TIMEOUT_MS = 2500;
const PAGE_CAP = 20;

export const FEED_CACHE_FRESH_MS = 90_000;

export interface FeedFilterKey {
  category: string | null;
  search: string;
  city?: string | null;
  location?: string | null;
}

export interface CachedFeed {
  listings: Listing[];
  hasMore: boolean;
  savedAt: number;
}

export function feedCacheKey(filters: FeedFilterKey): string {
  const search = filters.search.trim().toLowerCase();
  const parts: string[] = [];
  if (filters.category) parts.push(`cat:${filters.category}`);
  if (search.length >= 2) parts.push(`q:${search}`);
  if (filters.city) parts.push(`city:${filters.city}`);
  if (filters.location) parts.push(`loc:${filters.location}`);
  return parts.length ? parts.join('|') : 'all';
}

function storageKey(key: string) {
  return `${PREFIX}${key}`;
}

export async function getCachedFeed(key: string): Promise<CachedFeed | null> {
  const raw = await withTimeout(
    AsyncStorage.getItem(storageKey(key)).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CachedFeed;
    if (!parsed || !Array.isArray(parsed.listings) || parsed.listings.length === 0) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function setCachedFeed(key: string, payload: CachedFeed): Promise<void> {
  try {
    await withTimeout(
      AsyncStorage.setItem(storageKey(key), JSON.stringify(payload))
        .then(() => true)
        .catch(() => false),
      STORE_TIMEOUT_MS,
      false,
    );
  } catch {
    // Cache is optional; in-memory store still holds the latest fetch.
  }
}

export function persistFeedPage(
  filters: FeedFilterKey,
  listings: Listing[],
  hasMore: boolean,
): void {
  void setCachedFeed(feedCacheKey(filters), {
    listings: listings.slice(0, PAGE_CAP),
    hasMore: hasMore || listings.length > PAGE_CAP,
    savedAt: Date.now(),
  });
}
