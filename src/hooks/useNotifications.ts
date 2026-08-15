import {useCallback} from 'react';
import {useNotificationStore} from '../store/notificationStore';
import apiClient from '../services/apiClient';
import {ENDPOINTS} from '../config/api';
import {mapNotifications, unreadCountFrom} from '../utils/mappers';

export function useNotifications() {
  const store = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {data} = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST, {
        params: {page: 1, limit: 50},
      });
      const items = mapNotifications(data);
      store.setNotifications(items);
      const unread = unreadCountFrom(data, items);
      if (unread !== store.unreadCount) {
        store.setNotifications(items);
      }
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
      // Optimistic update
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    store.markAllAsRead();
    try {
      await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
    } catch {
      // Optimistic update
    }
  }, []);

  return {
    notifications: store.notifications,
    unreadCount: store.unreadCount,
    isLoading: store.isLoading,
    error: store.error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
}
