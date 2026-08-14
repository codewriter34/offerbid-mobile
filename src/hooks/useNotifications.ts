import {useCallback} from 'react';
import {useNotificationStore} from '../store/notificationStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {AppNotification} from '../types';

export function useNotifications() {
  const store = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get<AppNotification[]>(
        ENDPOINTS.NOTIFICATIONS.LIST,
      );
      store.setNotifications(data);
    } catch (err: any) {
      store.setError(
        err.response?.data?.message ?? 'Failed to load notifications',
      );
    } finally {
      store.setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    store.markAsRead(id);
    try {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
    } catch {
      // Optimistic update — if server fails, the UI already reflects read
    }
  }, []);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    error: store.error,
    fetchNotifications,
    markAsRead,
    markAllAsRead: store.markAllAsRead,
  };
}
