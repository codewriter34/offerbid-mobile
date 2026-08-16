import {AppNotification, NotificationType} from '@shared/types';
import {colors} from '@shared/theme/colors';

const TITLES: Record<NotificationType, string> = {
  new_bid: 'New bid received',
  bid_accepted: 'Bid accepted',
  bid_rejected: 'Bid rejected',
  bid_countered: 'Counter offer',
  bid_expiring: 'Bid expiring soon',
  listing_contact: 'Buyer contacted you',
  unknown: 'OfferBid',
};

export function notificationTitle(type: NotificationType): string {
  return TITLES[type] ?? TITLES.unknown;
}

const ACCENTS: Record<NotificationType, string> = {
  new_bid: colors.brand.blue,
  bid_accepted: colors.brand.success,
  bid_rejected: colors.brand.danger,
  bid_countered: colors.brand.blue,
  bid_expiring: colors.brand.warning,
  listing_contact: colors.brand.blue,
  unknown: colors.brand.gray,
};

export function notificationAccent(type: NotificationType): string {
  return ACCENTS[type] ?? ACCENTS.unknown;
}

export function notificationBody(notification: AppNotification): string {
  const payload = notification.payload as {
    listing_title?: string;
    listingTitle?: string;
    amount?: number;
    message?: string;
  };
  const title = payload.listingTitle ?? payload.listing_title;
  if (payload.message) return payload.message;
  if (title && payload.amount) return `${title} — ${payload.amount}`;
  if (title) return title;
  return 'Open to see the details.';
}
