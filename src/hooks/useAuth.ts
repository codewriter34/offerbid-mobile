import {useCallback, useEffect, useRef} from 'react';
import {useAuthStore} from '../store/authStore';
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
  unregisterFCMToken,
  onFCMTokenRefresh,
} from '../services/notifeeService';
import {getAccessToken} from '../services/tokenStorage';
import {GOOGLE_WEB_CLIENT_ID, IS_EXPO_GO} from '../config/env';
import {withTimeout} from '../utils/withTimeout';
import {LoginPayload, RegisterPayload, User, VerifyOtpPayload} from '../types';

export function useAuth() {
  const {user, isAuthenticated, isLoading, setUser, setLoading, setHub, reset} =
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
      const restoredUser = await withTimeout(restoreSession(), 8000, null);
      if (restoredUser) {
        setUser(restoredUser);
        void initPostAuthServices();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
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

      if (IS_EXPO_GO) {
        return;
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

  const applySession = async (sessionUser: User) => {
    setUser(sessionUser);
    void initPostAuthServices();
    return sessionUser;
  };

  const signIn = useCallback(async () => {
    setLoading(true);
    try {
      const result = await signInWithGoogle();
      return applySession(result.user);
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    setLoading(true);
    try {
      const result = await loginWithEmail(payload);
      return applySession(result.user);
    } catch (error) {
      setUser(null);
      throw error;
    }
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerAccount(payload);
  }, []);

  const confirmOtp = useCallback(async (payload: VerifyOtpPayload) => {
    setLoading(true);
    try {
      const result = await verifyOtp(payload);
      return applySession(result.user);
    } catch (error) {
      setLoading(false);
      throw error;
    }
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
      setLoading(true);
      try {
        const result = await resetPassword(payload);
        return applySession(result.user);
      } catch (error) {
        setLoading(false);
        throw error;
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    disconnectSocket();
    tokenRefreshUnsub.current?.();
    tokenRefreshUnsub.current = null;
    await unregisterFCMToken();
    await authSignOut();
    reset();
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
