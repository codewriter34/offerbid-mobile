import * as Notifications from 'expo-notifications';
import {NativeModules, Platform} from 'react-native';
import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {IS_EXPO_GO} from '@shared/config/env';

const CHANNEL_ID_BIDS = 'offerbid-bids';

let lastFcmToken: string | null = null;
let tokenRefreshUnsub: (() => void) | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function isNativeFcmToken(token: string): boolean {
  return (
    token.length > 0 &&
    !token.startsWith('ExponentPushToken') &&
    !/^[0-9a-f]{64}$/i.test(token)
  );
}

function hasNativeFirebase(): boolean {
  if (IS_EXPO_GO) return false;
  const modules = NativeModules as Record<string, unknown>;
  return Boolean(modules.RNFBAppModule || modules.NativeRNFBTurboApp);
}

type MessagingSdk = typeof import('@react-native-firebase/messaging');

function loadMessaging(): MessagingSdk | null {
  if (!hasNativeFirebase()) return null;
  try {
    return require('@react-native-firebase/messaging') as MessagingSdk;
  } catch {
    return null;
  }
}

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID_BIDS, {
      name: 'Bid Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync('offerbid-general', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function requestPermission(): Promise<boolean> {
  const settings = await Notifications.requestPermissionsAsync();
  const granted =
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!granted) return false;

  const messagingSdk = loadMessaging();
  if (messagingSdk && Platform.OS === 'ios') {
    const status = await messagingSdk.requestPermission(messagingSdk.getMessaging());
    return (
      status === messagingSdk.AuthorizationStatus.AUTHORIZED ||
      status === messagingSdk.AuthorizationStatus.PROVISIONAL
    );
  }
  return true;
}

export async function getFCMToken(): Promise<string | null> {
  const messagingSdk = loadMessaging();
  if (messagingSdk) {
    try {
      const messaging = messagingSdk.getMessaging();
      await messagingSdk.registerDeviceForRemoteMessages(messaging);
      const token = await messagingSdk.getToken(messaging);
      if (token && isNativeFcmToken(token)) {
        lastFcmToken = token;
        return token;
      }
    } catch {
      // Expo Go and missing native Firebase modules
    }
  }

  if (Platform.OS === 'android') {
    try {
      const device = await Notifications.getDevicePushTokenAsync();
      const token = typeof device.data === 'string' ? device.data : null;
      if (token && isNativeFcmToken(token)) {
        lastFcmToken = token;
        return token;
      }
    } catch {
      // No native FCM in Expo Go
    }
  }

  return null;
}

export function getCachedFcmToken(): string | null {
  return lastFcmToken;
}

export async function registerFCMToken(token: string): Promise<void> {
  if (!isNativeFcmToken(token)) return;
  lastFcmToken = token;
  await apiClient.post(ENDPOINTS.DEVICES, {
    token,
    platform: Platform.OS === 'ios' ? 'IOS' : 'ANDROID',
  });
}

export async function unregisterFCMToken(token?: string): Promise<void> {
  const value = token ?? lastFcmToken;
  if (!value) return;
  try {
    await apiClient.delete(ENDPOINTS.DEVICES, {data: {token: value}});
  } catch {
    // Best-effort on logout
  }
  lastFcmToken = null;
}

export async function displayNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {title, body, data, sound: true},
    trigger: null,
  });
}

export function listingIdFromPushData(
  data?: Record<string, unknown> | null,
): string | null {
  if (!data) return null;
  const nested = data.payload as Record<string, unknown> | undefined;
  const raw =
    data.listingId ??
    data.listing_id ??
    nested?.listingId ??
    nested?.listing_id;
  if (typeof raw === 'string' && raw.length > 0) return raw;
  if (typeof raw === 'number') return String(raw);
  return null;
}

export function onNotificationEvent(
  callback: (type: string, data?: Record<string, unknown>) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as
      | Record<string, unknown>
      | undefined;
    callback(typeof data?.type === 'string' ? data.type : '', data);
  });
}

export async function getInitialNotificationListingId(): Promise<string | null> {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data as
    | Record<string, unknown>
    | undefined;
  return listingIdFromPushData(data);
}

export function setupBackgroundHandler() {
  // Expo handles background presentation via setNotificationHandler.
}

export function onFCMTokenRefresh(callback: (token: string) => void) {
  tokenRefreshUnsub?.();
  tokenRefreshUnsub = null;

  const messagingSdk = loadMessaging();
  if (messagingSdk) {
    tokenRefreshUnsub = messagingSdk.onTokenRefresh(
      messagingSdk.getMessaging(),
      (next: string) => {
        if (isNativeFcmToken(next)) {
          lastFcmToken = next;
          callback(next);
        }
      },
    );
    return () => {
      tokenRefreshUnsub?.();
      tokenRefreshUnsub = null;
    };
  }

  const sub = Notifications.addPushTokenListener(token => {
    const value = typeof token.data === 'string' ? token.data : '';
    if (Platform.OS === 'android' && isNativeFcmToken(value)) {
      lastFcmToken = value;
      callback(value);
    }
  });
  tokenRefreshUnsub = () => sub.remove();
  return () => {
    tokenRefreshUnsub?.();
    tokenRefreshUnsub = null;
  };
}
