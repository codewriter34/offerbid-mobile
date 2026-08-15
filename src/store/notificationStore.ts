import {create} from 'zustand';
import {AppNotification} from '../types';

interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;

  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>(set => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  setNotifications: notifications =>
    set({
      notifications,
      unreadCount: notifications.filter(n => !n.read).length,
    }),

  addNotification: notification =>
    set(state => {
      const updated = [notification, ...state.notifications];
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      };
    }),

  markAsRead: id =>
    set(state => {
      const updated = state.notifications.map(n =>
        n.id === id ? {...n, read: true} : n,
      );
      return {
        notifications: updated,
        unreadCount: updated.filter(n => !n.read).length,
      };
    }),

  markAllAsRead: () =>
    set(state => ({
      notifications: state.notifications.map(n => ({...n, read: true})),
      unreadCount: 0,
    })),

  setLoading: isLoading => set({isLoading}),
  setError: error => set({error}),
  reset: () =>
    set({notifications: [], unreadCount: 0, isLoading: false, error: null}),
}));
