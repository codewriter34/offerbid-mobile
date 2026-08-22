import {useCallback, useEffect, useRef} from 'react';
import {useAuthStore} from '@features/auth/authStore';
import {
  signInWithGoogle,
  loginWithEmail,
  registerAccount,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  restoreSession,
  signOut as authSignOut,
  configureGoogleSignIn,
} from '@features/auth/authService';
import {connectSocket} from '@shared/lib/socket';
import {
  setupNotifications,
  requestPermission,
  getFCMToken,
  registerFCMToken,
  unregisterFCMToken,
  onFCMTokenRefresh,
} from '@features/notifications/pushService';
import {getAccessToken} from '@shared/lib/tokenStorage';
import {cacheUser, clearLocalSession, getCachedUser} from '@shared/lib/session';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {fetchNotifications} from '@features/notifications/notificationService';
import {GOOGLE_WEB_CLIENT_ID} from '@shared/config/env';
import {LoginPayload, RegisterPayload, User, VerifyOtpPayload} from '@shared/types';

export function useAuth() {
  const {user, isAuthenticated, isLoading, setUser, setHub} =
    useAuthStore();
  const tokenRefreshUnsub = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (GOOGLE_WEB_CLIENT_ID) {
      configureGoogleSignIn(GOOGLE_WEB_CLIENT_ID);
    }
    bootstrapAuth();

    return () => {
      tokenRefreshUnsub.current?.();
    };
  }, []);

  const bootstrapAuth = async () => {
    try {
      const restoredUser = await restoreSession();
      if (restoredUser) {
        setUser(restoredUser);
        void initPostAuthServices();
        void hydrateInbox();
        return;
      }
      const tokens = await getAccessToken();
      const cachedUser = tokens ? await getCachedUser() : null;
      if (cachedUser) {
        setUser(cachedUser);
        void initPostAuthServices();
        return;
      }
      setUser(null);
    } catch {
      const tokens = await getAccessToken();
      const cachedUser = tokens ? await getCachedUser() : null;
      if (cachedUser) {
        setUser(cachedUser);
      } else {
        setUser(null);
      }
    } finally {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
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

  const hydrateInbox = async () => {
    try {
      const {items, unread} = await fetchNotifications();
      useNotificationStore.getState().setNotifications(items, unread);
    } catch {
      // Inbox is non-blocking
    }
  };

  const applySession = async (sessionUser: User) => {
    setUser(sessionUser);
    void cacheUser(sessionUser);
    void initPostAuthServices();
    void hydrateInbox();
    return sessionUser;
  };

  const signIn = useCallback(async () => {
    const result = await signInWithGoogle();
    return applySession(result.user);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const result = await loginWithEmail(payload);
    return applySession(result.user);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerAccount(payload);
  }, []);

  const confirmOtp = useCallback(async (payload: VerifyOtpPayload) => {
    const result = await verifyOtp(payload);
    return applySession(result.user);
  }, []);

  const sendOtp = useCallback(
    async (email: string, purpose: 'EMAIL_VERIFY' | 'PASSWORD_RESET' = 'EMAIL_VERIFY') => {
      await resendOtp(email, purpose);
    },
    [],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    await forgotPassword(email);
  }, []);

  const confirmPasswordReset = useCallback(
    async (payload: {email: string; code: string; password: string}) => {
      const result = await resetPassword(payload);
      return applySession(result.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    tokenRefreshUnsub.current?.();
    tokenRefreshUnsub.current = null;
    await unregisterFCMToken();
    await authSignOut();
    await clearLocalSession();
  }, []);

  return {
    user,
    isAuthenticated,
    isLoading,
    needsProfileComplete: isAuthenticated && !user?.profileComplete,
    signIn,
    login,
    register,
    confirmOtp,
    sendOtp,
    requestPasswordReset,
    confirmPasswordReset,
    signOut,
    setHub,
  };
}
