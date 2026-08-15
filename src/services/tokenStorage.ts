import * as Keychain from 'react-native-keychain';

const SERVICE_NAME = 'com.offerbid.auth';
const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';

export async function storeTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  await Keychain.setInternetCredentials(
    SERVICE_NAME,
    ACCESS_KEY,
    JSON.stringify({accessToken, refreshToken}),
  );
}

export async function getTokens(): Promise<{
  accessToken: string;
  refreshToken: string;
} | null> {
  const credentials = await Keychain.getInternetCredentials(SERVICE_NAME);
  if (!credentials) return null;
  try {
    return JSON.parse(credentials.password);
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
  await Keychain.resetInternetCredentials(SERVICE_NAME);
}
