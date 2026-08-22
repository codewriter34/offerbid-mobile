import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {withTimeout} from '@shared/lib/withTimeout';

const LEGACY_TOKEN_KEY = 'offerbid.auth.tokens';
const ACCESS_KEY = 'offerbid.auth.access';
const REFRESH_KEY = 'offerbid.auth.refresh';
const FALLBACK_KEY = 'offerbid.auth.tokens.fallback';
const SECURE_TIMEOUT_MS = 8000;
const FALLBACK_TIMEOUT_MS = 2500;

const secureOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

let memoryTokens: TokenPair | null = null;

function isPair(value: unknown): value is TokenPair {
  if (!value || typeof value !== 'object') return false;
  const rec = value as TokenPair;
  return Boolean(rec.accessToken && rec.refreshToken);
}

async function writeSecure(key: string, value: string): Promise<boolean> {
  return withTimeout(
    SecureStore.setItemAsync(key, value, secureOptions)
      .then(() => true)
      .catch(() => false),
    SECURE_TIMEOUT_MS,
    false,
  );
}

async function readSecure(key: string): Promise<string | null> {
  return withTimeout(
    SecureStore.getItemAsync(key, secureOptions).catch(() => null),
    SECURE_TIMEOUT_MS,
    null,
  );
}

async function removeSecure(key: string): Promise<void> {
  await withTimeout(
    SecureStore.deleteItemAsync(key, secureOptions)
      .then(() => true)
      .catch(() => false),
    SECURE_TIMEOUT_MS,
    false,
  );
}

async function writeFallback(tokens: TokenPair): Promise<void> {
  await withTimeout(
    AsyncStorage.setItem(FALLBACK_KEY, JSON.stringify(tokens))
      .then(() => true)
      .catch(() => false),
    FALLBACK_TIMEOUT_MS,
    false,
  );
}

async function readFallback(): Promise<TokenPair | null> {
  const raw = await withTimeout(
    AsyncStorage.getItem(FALLBACK_KEY).catch(() => null),
    FALLBACK_TIMEOUT_MS,
    null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isPair(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function removeFallback(): Promise<void> {
  await withTimeout(
    AsyncStorage.removeItem(FALLBACK_KEY).then(() => true).catch(() => false),
    FALLBACK_TIMEOUT_MS,
    false,
  );
}

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  const tokens = {accessToken, refreshToken};
  memoryTokens = tokens;
  await Promise.all([
    writeSecure(ACCESS_KEY, accessToken),
    writeSecure(REFRESH_KEY, refreshToken),
    writeFallback(tokens),
    removeSecure(LEGACY_TOKEN_KEY),
  ]);
}

async function readPersistedTokens(): Promise<TokenPair | null> {
  const [accessToken, refreshToken] = await Promise.all([
    readSecure(ACCESS_KEY),
    readSecure(REFRESH_KEY),
  ]);
  if (accessToken && refreshToken) {
    return {accessToken, refreshToken};
  }

  const fallback = await readFallback();
  if (fallback) return fallback;

  const raw = await readSecure(LEGACY_TOKEN_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TokenPair;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function getTokens(): Promise<TokenPair | null> {
  if (memoryTokens) return memoryTokens;

  const persisted = await readPersistedTokens();
  if (!persisted) return null;
  memoryTokens = persisted;
  void storeTokens(persisted.accessToken, persisted.refreshToken);
  return persisted;
}

export async function getAccessToken(): Promise<string | null> {
  if (memoryTokens?.accessToken) return memoryTokens.accessToken;
  const tokens = await getTokens();
  return tokens?.accessToken ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (memoryTokens?.refreshToken) return memoryTokens.refreshToken;
  const tokens = await getTokens();
  return tokens?.refreshToken ?? null;
}

export async function clearTokens(): Promise<void> {
  memoryTokens = null;
  await Promise.all([
    removeSecure(ACCESS_KEY),
    removeSecure(REFRESH_KEY),
    removeSecure(LEGACY_TOKEN_KEY),
    removeFallback(),
  ]);
}
