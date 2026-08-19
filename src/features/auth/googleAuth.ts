import {NativeModules, Platform} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import {IS_EXPO_GO, GOOGLE_WEB_CLIENT_ID} from '@shared/config/env';

WebBrowser.maybeCompleteAuthSession();

export const GoogleSignInStatusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

function hasNativeGoogleSignIn(): boolean {
  if (IS_EXPO_GO) return false;
  return Boolean((NativeModules as Record<string, unknown>).RNGoogleSignin);
}

function loadGoogleSignIn(): typeof import('@react-native-google-signin/google-signin') | null {
  if (!hasNativeGoogleSignIn()) return null;
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

export function configureGoogleSignIn(webClientId: string) {
  const google = loadGoogleSignIn();
  if (!google || !webClientId) return;
  try {
    google.GoogleSignin.configure({
      webClientId,
      offlineAccess: false,
    });
  } catch {
    // Native module missing
  }
}

export async function getGoogleIdToken(): Promise<string> {
  const google = loadGoogleSignIn();
  if (google) {
    await google.GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
    const result = await google.GoogleSignin.signIn();
    const idToken = result.data?.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In did not return an ID token');
    }
    return idToken;
  }
  return getGoogleIdTokenWithBrowser();
}

async function getGoogleIdTokenWithBrowser(): Promise<string> {
  if (!GOOGLE_WEB_CLIENT_ID) {
    throw new Error(
      'Google Sign-In is not configured. Add GOOGLE_WEB_CLIENT_ID or use a development build.',
    );
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'offerbid',
    path: 'oauthredirect',
  });
  const nonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`,
  );
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  };
  const request = new AuthSession.AuthRequest({
    clientId: GOOGLE_WEB_CLIENT_ID,
    redirectUri,
    responseType: AuthSession.ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
    extraParams: {nonce, prompt: 'select_account'},
    usePKCE: false,
  });

  const result = await request.promptAsync(discovery);
  if (result.type === 'cancel' || result.type === 'dismiss') {
    const error = new Error('Sign in cancelled');
    (error as Error & {code: string}).code = GoogleSignInStatusCodes.SIGN_IN_CANCELLED;
    throw error;
  }
  if (result.type !== 'success') {
    throw new Error('Google Sign-In did not complete');
  }
  const idToken = result.params.id_token;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token');
  }
  return idToken;
}

export async function signOutGoogle(): Promise<void> {
  try {
    loadGoogleSignIn()?.GoogleSignin.signOut();
  } catch {
    // Not signed in with native Google
  }
}

export function isPlayServicesError(error: unknown): boolean {
  return (
    Platform.OS === 'android' &&
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    String((error as {code: unknown}).code) ===
      GoogleSignInStatusCodes.PLAY_SERVICES_NOT_AVAILABLE
  );
}
