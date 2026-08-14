import {GoogleSignin, statusCodes} from '@react-native-google-signin/google-signin';
import apiClient from './apiClient';
import {storeTokens, clearTokens, getTokens} from './tokenStorage';
import {ENDPOINTS} from '../config/api';
import {AuthTokens, User} from '../types';

export function configureGoogleSignIn(webClientId: string) {
  GoogleSignin.configure({
    webClientId,
    offlineAccess: true,
  });
}

export async function signInWithGoogle(): Promise<{
  tokens: AuthTokens;
  user: User;
}> {
  await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  const signInResult = await GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token');
  }

  const {data} = await apiClient.post(ENDPOINTS.AUTH.GOOGLE, {
    id_token: idToken,
  });

  await storeTokens(data.access_token, data.refresh_token);

  return {
    tokens: {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    },
    user: data.user,
  };
}

export async function restoreSession(): Promise<User | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  try {
    const {data} = await apiClient.get(ENDPOINTS.USERS.ME);
    return data;
  } catch {
    await clearTokens();
    return null;
  }
}

export async function signOut(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign out can fail if not signed in via Google — that's fine
  }
  await clearTokens();
}

export {statusCodes as GoogleSignInStatusCodes};
