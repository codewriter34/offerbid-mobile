export type NotificationType =
  | 'new_bid'
  | 'bid_accepted'
  | 'bid_rejected'
  | 'bid_countered'
  | 'bid_expiring'
  | 'listing_contact'
  | 'unknown';

export interface AppNotification {
  id: string;
  userId: string | null;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}
