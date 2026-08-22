import apiClient from '@api/client';
import {storeTokens, clearTokens, getTokens, getRefreshToken} from '@shared/lib/tokenStorage';
import {ENDPOINTS} from '@api/endpoints';
import {AuthTokens, User, RegisterPayload, LoginPayload, VerifyOtpPayload} from '@shared/types';
import {extractTokens} from '@api/normalize';
import {mapUser} from '@api/mappers';
import {getGoogleIdToken, signOutGoogle} from './googleAuth';
import {firebaseIdTokenFromGoogle, signOutFirebase} from './firebaseAuth';

export {GoogleSignInStatusCodes, configureGoogleSignIn} from './googleAuth';

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
  const googleIdToken = await getGoogleIdToken();
  const idToken = await firebaseIdTokenFromGoogle(googleIdToken);
  const {data} = await apiClient.post(ENDPOINTS.AUTH.GOOGLE, {idToken});
  return persistSession(data);
}

export async function restoreSession(): Promise<User | null> {
  const tokens = await getTokens();
  if (!tokens) return null;

  try {
    const {data} = await apiClient.get(ENDPOINTS.USERS.ME, {timeout: 8000});
    const user = mapUser(data);
    const {cacheUser} = await import('@shared/lib/session');
    await cacheUser(user);
    return user;
  } catch (error: any) {
    const status = error?.response?.status;
    if (status === 401 || status === 403) {
      return null;
    }
    const {getCachedUser} = await import('@shared/lib/session');
    return getCachedUser();
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
  await Promise.all([signOutGoogle(), signOutFirebase()]);
  await clearTokens();
}
