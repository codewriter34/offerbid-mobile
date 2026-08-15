import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';
import {IS_EXPO_GO} from '../config/env';

const CHANNEL_ID_BIDS = 'offerbid-bids';

let lastFcmToken: string | null = null;
let tokenRefreshUnsub: Notifications.EventSubscription | null = null;

if (!IS_EXPO_GO) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function setupNotifications(): Promise<void> {
  if (IS_EXPO_GO) {
    return;
  }
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
  if (IS_EXPO_GO) {
    return false;
  }
  const settings = await Notifications.requestPermissionsAsync();
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  if (IS_EXPO_GO) {
    return null;
  }
  try {
    const device = await Notifications.getDevicePushTokenAsync();
    lastFcmToken = typeof device.data === 'string' ? device.data : null;
    return lastFcmToken;
  } catch {
    try {
      const expoToken = await Notifications.getExpoPushTokenAsync();
      lastFcmToken = expoToken.data;
      return lastFcmToken;
    } catch {
      return null;
    }
  }
}

export function getCachedFcmToken(): string | null {
  return lastFcmToken;
}

export async function registerFCMToken(token: string): Promise<void> {
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
    content: {title, body, data},
    trigger: null,
  });
}

export function onNotificationEvent(
  callback: (type: string, data?: Record<string, string>) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as
      | Record<string, string>
      | undefined;
    callback(data?.type ?? '', data);
  });
}

export function setupBackgroundHandler() {
  // Expo handles background presentation via setNotificationHandler.
}

export function onFCMTokenRefresh(callback: (token: string) => void) {
  tokenRefreshUnsub?.remove();
  tokenRefreshUnsub = Notifications.addPushTokenListener(token => {
    const value = typeof token.data === 'string' ? token.data : '';
    if (value) {
      lastFcmToken = value;
      callback(value);
    }
  });
  return () => {
    tokenRefreshUnsub?.remove();
    tokenRefreshUnsub = null;
  };
}
