import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapNotifications, unreadCountFrom} from '@api/mappers';

export async function fetchNotifications() {
  const {data} = await apiClient.get(ENDPOINTS.NOTIFICATIONS.LIST, {
    params: {page: 1, limit: 50},
  });
  const items = mapNotifications(data);
  return {items, unread: unreadCountFrom(data, items)};
}

export async function markNotificationRead(id: string) {
  await apiClient.patch(ENDPOINTS.NOTIFICATIONS.MARK_READ(id));
}

export async function markAllNotificationsRead() {
  await apiClient.patch(ENDPOINTS.NOTIFICATIONS.READ_ALL);
}
