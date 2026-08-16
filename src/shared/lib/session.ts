import {clearTokens} from '@shared/lib/tokenStorage';
import {disconnectSocket} from '@shared/lib/socket';
import {useAuthStore} from '@features/auth/authStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {useBidStore} from '@features/bids/bidStore';

export async function clearLocalSession() {
  await clearTokens();
  disconnectSocket();
  useAuthStore.getState().reset();
  useNotificationStore.getState().reset();
  useBidStore.getState().reset();
}
