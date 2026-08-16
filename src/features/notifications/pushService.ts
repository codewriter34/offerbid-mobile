import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {Platform} from 'react-native';
import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';

const CHANNEL_ID_BIDS = 'offerbid-bids';

let lastFcmToken: string | null = null;
let tokenRefreshUnsub: Notifications.EventSubscription | null = null;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function expoProjectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as {eas?: {projectId?: string}} | undefined)?.eas
      ?.projectId
  );
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
  return (
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const device = await Notifications.getDevicePushTokenAsync();
    lastFcmToken = typeof device.data === 'string' ? device.data : null;
    if (lastFcmToken) return lastFcmToken;
  } catch {
    // Expo Go and some dev clients have no native FCM/APNs credentials
  }

  try {
    const projectId = expoProjectId();
    const expoToken = await Notifications.getExpoPushTokenAsync(
      projectId ? {projectId} : {},
    );
    lastFcmToken = expoToken.data;
    return lastFcmToken;
  } catch {
    return null;
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
