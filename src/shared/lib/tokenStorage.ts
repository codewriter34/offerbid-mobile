import * as SecureStore from 'expo-secure-store';
import {withTimeout} from '@shared/lib/withTimeout';

const LEGACY_TOKEN_KEY = 'offerbid.auth.tokens';
const ACCESS_KEY = 'offerbid.auth.access';
const REFRESH_KEY = 'offerbid.auth.refresh';
const STORE_TIMEOUT_MS = 2500;

async function write(key: string, value: string): Promise<boolean> {
  return withTimeout(
    SecureStore.setItemAsync(key, value).then(() => true).catch(() => false),
    STORE_TIMEOUT_MS,
    false,
  );
}

async function read(key: string): Promise<string | null> {
  return withTimeout(
    SecureStore.getItemAsync(key).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
}

async function remove(key: string): Promise<void> {
  await withTimeout(
    SecureStore.deleteItemAsync(key).then(() => true).catch(() => false),
    STORE_TIMEOUT_MS,
    false,
  );
}

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Promise.all([
    write(ACCESS_KEY, accessToken),
    write(REFRESH_KEY, refreshToken),
    remove(LEGACY_TOKEN_KEY),
  ]);
}

export async function getTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const [accessToken, refreshToken] = await Promise.all([
    read(ACCESS_KEY),
    read(REFRESH_KEY),
  ]);
  if (accessToken && refreshToken) {
    return {accessToken, refreshToken};
  }

  const raw = await read(LEGACY_TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      accessToken?: string;
      refreshToken?: string;
    };
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    await storeTokens(parsed.accessToken, parsed.refreshToken);
    return {accessToken: parsed.accessToken, refreshToken: parsed.refreshToken};
  } catch {
    return null;
  }
}

export async function getAccessToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const tokens = await getTokens();
  return tokens?.refreshToken ?? null;
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    remove(ACCESS_KEY),
    remove(REFRESH_KEY),
    remove(LEGACY_TOKEN_KEY),
  ]);
}
