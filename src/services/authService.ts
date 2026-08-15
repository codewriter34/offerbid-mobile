import apiClient from './apiClient';
import {storeTokens, clearTokens, getTokens, getRefreshToken} from './tokenStorage';
import {ENDPOINTS} from '../config/api';
import {AuthTokens, User, RegisterPayload, LoginPayload, VerifyOtpPayload} from '../types';
import {extractTokens} from '../utils/apiNormalize';
import {mapUser} from '../utils/mappers';

export const GoogleSignInStatusCodes = {
  SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
  PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
};

function loadGoogleSignIn(): typeof import('@react-native-google-signin/google-signin') | null {
  try {
    return require('@react-native-google-signin/google-signin');
  } catch {
    return null;
  }
}

export function configureGoogleSignIn(webClientId: string) {
  try {
    const google = loadGoogleSignIn();
    google?.GoogleSignin.configure({
      webClientId,
      offlineAccess: true,
    });
  } catch {
    // Native Google Sign-In is unavailable in Expo Go
  }
}

async function persistSession(data: unknown): Promise<{tokens: AuthTokens; user: User}> {
  const extracted = extractTokens(data);
  if (!extracted.accessToken) {
    throw new Error('No access token returned');
  }
  await storeTokens(extracted.accessToken, extracted.refreshToken);
  return {
    tokens: {
      accessToken: extracted.accessToken,
      refreshToken: extracted.refreshToken,
    },
    user: mapUser(extracted.user),
  };
}

export async function registerAccount(payload: RegisterPayload): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
}

export async function verifyOtp(payload: VerifyOtpPayload): Promise<{
  tokens: AuthTokens;
  user: User;
}> {
  const {data} = await apiClient.post(ENDPOINTS.AUTH.VERIFY_OTP, payload);
  return persistSession(data);
}

export async function resendOtp(
  email: string,
  purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' = 'EMAIL_VERIFY',
): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.RESEND_OTP, {email, purpose});
}

export async function loginWithEmail(payload: LoginPayload): Promise<{
  tokens: AuthTokens;
  user: User;
}> {
  const {data} = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload);
  return persistSession(data);
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, {email});
}

export async function resetPassword(payload: {
  email: string;
  code: string;
  password: string;
}): Promise<{tokens: AuthTokens; user: User}> {
  const {data} = await apiClient.post(ENDPOINTS.AUTH.RESET_PASSWORD, payload);
  return persistSession(data);
}

export async function signInWithGoogle(): Promise<{
  tokens: AuthTokens;
  user: User;
}> {
  const google = loadGoogleSignIn();
  if (!google) {
    throw new Error(
      'Google Sign-In needs a development build. Use email login in Expo Go.',
    );
  }

  await google.GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
  const signInResult = await google.GoogleSignin.signIn();

  const idToken = signInResult.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an ID token');
  }

  const {data} = await apiClient.post(ENDPOINTS.AUTH.GOOGLE, {
    id_token: idToken,
  });

  return persistSession(data);
}

export async function restoreSession(): Promise<User | null> {
  try {
    const tokens = await getTokens();
    if (!tokens) return null;

    const {data} = await apiClient.get(ENDPOINTS.USERS.ME, {timeout: 8000});
    return mapUser(data);
  } catch {
    await clearTokens();
    return null;
  }
}

export async function logoutRemote(): Promise<void> {
  const refreshToken = await getRefreshToken();
  try {
    await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {refreshToken});
  } catch {
    // Still clear local session
  }
}

export async function signOut(): Promise<void> {
  try {
    await logoutRemote();
  } catch {
    // ignore
  }
  try {
    loadGoogleSignIn()?.GoogleSignin.signOut();
  } catch {
    // Google sign out can fail if not signed in via Google
  }
  await clearTokens();
}
