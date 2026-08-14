// TODO: Implement notifications hook
// - Fetch notifications from API
// - Mark as read
// - Unread count for tab badge

export function useNotifications() {
  // TODO: Implement
  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: async () => {},
    markAsRead: async (_id: string) => {},
  };
}
