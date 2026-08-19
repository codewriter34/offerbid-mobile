import {NativeModules} from 'react-native';
import {IS_EXPO_GO, FIREBASE_WEB_CONFIG} from '@shared/config/env';

type NativeAuthSdk = typeof import('@react-native-firebase/auth');

function hasNativeFirebaseAuth(): boolean {
  if (IS_EXPO_GO) return false;
  const modules = NativeModules as Record<string, unknown>;
  return Boolean(modules.RNFBAuthModule || modules.RNFBAppModule || modules.NativeRNFBTurboApp);
}

function loadNativeAuth(): NativeAuthSdk | null {
  if (!hasNativeFirebaseAuth()) return null;
  try {
    return require('@react-native-firebase/auth') as NativeAuthSdk;
  } catch {
    return null;
  }
}

function getJsAuth() {
  const {getApps, initializeApp} = require('firebase/app') as typeof import('firebase/app');
  const {getAuth} = require('firebase/auth') as typeof import('firebase/auth');
  const app = getApps()[0] ?? initializeApp(FIREBASE_WEB_CONFIG);
  return getAuth(app);
}

export async function firebaseIdTokenFromGoogle(googleIdToken: string): Promise<string> {
  const nativeAuth = loadNativeAuth();
  if (nativeAuth) {
    const credential = nativeAuth.GoogleAuthProvider.credential(googleIdToken);
    const result = await nativeAuth.signInWithCredential(nativeAuth.getAuth(), credential);
    const token = await result.user.getIdToken(true);
    if (!token) throw new Error('Firebase did not return an ID token');
    return token;
  }

  if (!FIREBASE_WEB_CONFIG.apiKey || !FIREBASE_WEB_CONFIG.appId) {
    throw new Error('Firebase Auth is not configured');
  }

  const {GoogleAuthProvider, signInWithCredential} =
    require('firebase/auth') as typeof import('firebase/auth');
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const result = await signInWithCredential(getJsAuth(), credential);
  const token = await result.user.getIdToken(true);
  if (!token) throw new Error('Firebase did not return an ID token');
  return token;
}

export async function signOutFirebase(): Promise<void> {
  try {
    const nativeAuth = loadNativeAuth();
    if (nativeAuth) {
      await nativeAuth.signOut(nativeAuth.getAuth());
      return;
    }
    const {signOut} = require('firebase/auth') as typeof import('firebase/auth');
    await signOut(getJsAuth());
  } catch {
    // Not signed in to Firebase
  }
}
