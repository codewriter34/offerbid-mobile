import * as SecureStore from 'expo-secure-store';
import {withTimeout} from '../utils/withTimeout';

const TOKEN_KEY = 'offerbid.auth.tokens';
const STORE_TIMEOUT_MS = 2500;

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await withTimeout(
    SecureStore.setItemAsync(
      TOKEN_KEY,
      JSON.stringify({accessToken, refreshToken}),
    ).then(() => true).catch(() => false),
    STORE_TIMEOUT_MS,
    false,
  );
}

export async function getTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const raw = await withTimeout(
    SecureStore.getItemAsync(TOKEN_KEY).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
  if (!raw) return null;
  try {
    return JSON.parse(raw);
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
  await withTimeout(
    SecureStore.deleteItemAsync(TOKEN_KEY).then(() => true).catch(() => false),
    STORE_TIMEOUT_MS,
    false,
  );
}
