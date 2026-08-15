import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
  Event,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {Platform} from 'react-native';
import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';

const CHANNEL_ID_BIDS = 'offerbid-bids';
const CHANNEL_ID_GENERAL = 'offerbid-general';

export async function setupNotifications(): Promise<void> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: CHANNEL_ID_BIDS,
      name: 'Bid Updates',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    await notifee.createChannel({
      id: CHANNEL_ID_GENERAL,
      name: 'General',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
}

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    const authStatus = await messaging().requestPermission();
    return (
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL
    );
  }

  const settings = await notifee.requestPermission();
  return settings.authorizationStatus >= 1;
}

export async function getFCMToken(): Promise<string | null> {
  try {
    const token = await messaging().getToken();
    return token;
  } catch {
    return null;
  }
}

export async function registerFCMToken(token: string): Promise<void> {
  await apiClient.put(ENDPOINTS.USERS.FCM_TOKEN, {fcm_token: token});
}

export async function displayNotification(
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  const channelId = data?.type?.includes('bid')
    ? CHANNEL_ID_BIDS
    : CHANNEL_ID_GENERAL;

  await notifee.displayNotification({
    title,
    body,
    data,
    android: {
      channelId,
      smallIcon: 'ic_notification',
      pressAction: {id: 'default'},
      style: {type: AndroidStyle.BIGTEXT, text: body},
    },
  });
}

export function onNotificationEvent(
  callback: (type: string, data?: Record<string, string>) => void,
) {
  return notifee.onForegroundEvent(({type, detail}: Event) => {
    if (type === EventType.PRESS && detail.notification?.data) {
      callback(
        detail.notification.data.type as string,
        detail.notification.data as Record<string, string>,
      );
    }
  });
}

export function setupBackgroundHandler() {
  notifee.onBackgroundEvent(async ({type, detail}: Event) => {
    if (type === EventType.PRESS && detail.notification?.id) {
      await notifee.cancelNotification(detail.notification.id);
    }
  });

  messaging().setBackgroundMessageHandler(async remoteMessage => {
    if (remoteMessage.notification) {
      await displayNotification(
        remoteMessage.notification.title ?? 'OfferBid',
        remoteMessage.notification.body ?? '',
        remoteMessage.data as Record<string, string>,
      );
    }
  });
}

export function onFCMTokenRefresh(callback: (token: string) => void) {
  return messaging().onTokenRefresh(callback);
}
