import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';
import {AuthTokens, GoogleAuthPayload} from '../types';

// TODO: Implement full auth flow
// 1. Get Google ID token from @react-native-google-signin
// 2. Send to NestJS for verification + JWT issuance
// 3. Store tokens in react-native-keychain
// 4. Handle token refresh

export async function signInWithGoogle(_payload: GoogleAuthPayload): Promise<AuthTokens> {
  throw new Error('Not implemented');
}

export async function refreshToken(_refreshToken: string): Promise<AuthTokens> {
  throw new Error('Not implemented');
}

export async function signOut(): Promise<void> {
  throw new Error('Not implemented');
}
