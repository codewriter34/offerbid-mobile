export type NotificationType =
  | 'new_bid'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_countered'
  | 'bid_expiring';

export interface AppNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}
