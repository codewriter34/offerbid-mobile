import {useCallback, useEffect, useRef} from 'react';
import {useAuthStore} from '../store/authStore';
import {
  signInWithGoogle,
  restoreSession,
  signOut as authSignOut,
  configureGoogleSignIn,
} from '../services/authService';
import {
  connectSocket,
  disconnectSocket,
} from '../services/socketClient';
import {
  setupNotifications,
  requestPermission,
  getFCMToken,
  registerFCMToken,
  onFCMTokenRefresh,
} from '../services/notifeeService';
import {getAccessToken} from '../services/tokenStorage';
import {GOOGLE_WEB_CLIENT_ID} from '../config/env';

export function useAuth() {
  const {user, isAuthenticated, isLoading, setUser, setLoading, setHub, reset} =
    useAuthStore();
  const tokenRefreshUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    bootstrapAuth();

    return () => {
      tokenRefreshUnsub.current?.();
    };
  }, []);

  const bootstrapAuth = async () => {
    setLoading(true);
    try {
      const restoredUser = await restoreSession();
      if (restoredUser) {
        setUser(restoredUser);
        await initPostAuthServices();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  };

  const initPostAuthServices = async () => {
    try {
      const token = await getAccessToken();
      if (token) {
        connectSocket(token);
      }

      await setupNotifications();
      const granted = await requestPermission();
      if (granted) {
        const fcmToken = await getFCMToken();
        if (fcmToken) {
          await registerFCMToken(fcmToken);
        }
        tokenRefreshUnsub.current = onFCMTokenRefresh(async newToken => {
          await registerFCMToken(newToken);
        });
      }
    } catch {
      // Non-critical — app works without push/realtime
    }
  };

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      setUser(result.user);
      await initPostAuthServices();
      return result.user;
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    disconnectSocket();
    tokenRefreshUnsub.current?.();
    tokenRefreshUnsub.current = null;
    await authSignOut();
    reset();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    needsHubSelection: isAuthenticated && !user?.hub_id,
    signIn,
    signOut,
    setHub,
  };
}
