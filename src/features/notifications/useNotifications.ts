import {useCallback} from 'react';
import {useNotificationStore} from './notificationStore';
import * as notificationService from './notificationService';

export function useNotifications() {
  const store = useNotificationStore();

  const fetchNotifications = useCallback(async () => {
    store.setLoading(true);
    store.setError(null);
    try {
      const {items, unread} = await notificationService.fetchNotifications();
      store.setNotifications(items, unread);
    } catch (err: any) {
      store.setError(err.response?.data?.message ?? 'Failed to load notifications');
    } finally {
      store.setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    store.markAsRead(id);
    try {
      await notificationService.markNotificationRead(id);
    } catch {
      // Optimistic update
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    store.markAllAsRead();
    try {
      await notificationService.markAllNotificationsRead();
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
