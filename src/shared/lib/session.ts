import AsyncStorage from '@react-native-async-storage/async-storage';
import {clearTokens} from '@shared/lib/tokenStorage';
import {disconnectSocket} from '@shared/lib/socket';
import {useAuthStore} from '@features/auth/authStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {useBidStore} from '@features/bids/bidStore';
import {User} from '@shared/types';
import {withTimeout} from '@shared/lib/withTimeout';

const USER_KEY = 'offerbid.auth.user';

export async function cacheUser(user: User): Promise<void> {
  await withTimeout(
    AsyncStorage.setItem(USER_KEY, JSON.stringify(user))
      .then(() => true)
      .catch(() => false),
    2500,
    false,
  );
}

export async function getCachedUser(): Promise<User | null> {
  const raw = await withTimeout(
    AsyncStorage.getItem(USER_KEY).catch(() => null),
    2500,
    null,
  );
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as User;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearCachedUser(): Promise<void> {
  await withTimeout(
    AsyncStorage.removeItem(USER_KEY).then(() => true).catch(() => false),
    2500,
    false,
  );
}

export async function clearLocalSession() {
  await Promise.all([clearTokens(), clearCachedUser()]);
  disconnectSocket();
  useAuthStore.getState().reset();
  useNotificationStore.getState().reset();
  useBidStore.getState().reset();
}
