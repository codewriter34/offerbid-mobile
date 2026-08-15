import {User} from '../types/user';
import {Listing, ListingImage, ListingStatus} from '../types/listing';
import {Bid, BidStatus} from '../types/bid';
import {AppNotification, NotificationType} from '../types/notification';
import {Hub, HubsResponse} from '../types/hub';
import {Identity, IdentityStatus} from '../types/identity';
import {LISTING_CATEGORIES} from '../config/hubs';
import {extractList, pickNumber, pickString} from './apiNormalize';

type Raw = Record<string, any>;

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

export function mapUser(rawInput: unknown): User {
  const raw = asRecord(rawInput);
  const city = pickString(raw.city);
  const address = pickString(raw.address);
  const location = pickString(raw.location);
  return {
    id: String(raw.id ?? ''),
    email: pickString(raw.email),
    fullName:
      pickString(raw.fullName, raw.display_name, raw.displayName, raw.name) ??
      'User',
    phone: pickString(raw.phone),
    countryCode: pickString(raw.countryCode, raw.country_code),
    country: pickString(raw.country),
    city,
    address,
    location,
    avatarUrl: pickString(raw.avatarUrl, raw.avatar, raw.avatar_url, raw.url),
    profileComplete: Boolean(
      raw.profileComplete ?? raw.profile_complete ?? (city && address && location),
    ),
    isVerified: Boolean(raw.isVerified ?? raw.is_verified),
    googleId: pickString(raw.googleId, raw.google_id),
    createdAt: pickString(raw.createdAt, raw.created_at),
  };
}

function mapListingStatus(value: unknown): ListingStatus | string {
  const status = String(value ?? 'ACTIVE').toUpperCase();
  if (status === 'WITHDRAWN') return 'CLOSED';
  if (status === 'ACTIVE' || status === 'SOLD' || status === 'CLOSED') {
    return status;
  }
  return status;
}

function mapImages(raw: unknown): ListingImage[] {
  if (!Array.isArray(raw)) return [];
  const images: ListingImage[] = [];
  raw.forEach((item, index) => {
    if (typeof item === 'string') {
      images.push({id: String(index), url: item});
      return;
    }
    const rec = asRecord(item);
    const url = pickString(rec.url, rec.publicUrl, rec.cloudinary_url);
    if (url) {
      images.push({id: pickString(rec.id) ?? String(index), url});
    }
  });
  return images;
}

export function mapListing(rawInput: unknown): Listing {
  const raw = asRecord(rawInput);
  return {
    id: String(raw.id ?? ''),
    sellerId: String(raw.sellerId ?? raw.seller_id ?? raw.userId ?? ''),
    category: raw.category ?? 'Electronics',
    title: pickString(raw.title) ?? '',
    description: pickString(raw.description) ?? '',
    askingPrice: pickNumber(raw.askingPrice, raw.starting_price, raw.price) ?? 0,
    minBidPrice: pickNumber(raw.minBidPrice, raw.min_bid, raw.minBid) ?? 0,
    currency: pickString(raw.currency) ?? 'XAF',
    status: mapListingStatus(raw.status),
    location: pickString(raw.location, raw.neighborhood),
    city: pickString(raw.city),
    images: mapImages(raw.images),
    highestBidAmount: pickNumber(
      raw.highestBidAmount,
      raw.highestActiveBid,
      asRecord(raw.highestBid).amount,
      asRecord(raw.highestActiveBid).offerAmount,
    ),
    createdAt: pickString(raw.createdAt, raw.created_at) ?? new Date().toISOString(),
  };
}

function mapBidStatus(value: unknown): BidStatus | string {
  return String(value ?? 'PENDING').toUpperCase();
}

export function mapBid(rawInput: unknown, listingTitle?: string): Bid {
  const raw = asRecord(rawInput);
  const listing = asRecord(raw.listing);
  return {
    id: String(raw.id ?? ''),
    listingId: String(raw.listingId ?? raw.listing_id ?? listing.id ?? ''),
    listingTitle:
      listingTitle ??
      pickString(raw.listingTitle, listing.title) ??
      undefined,
    buyerId: String(raw.buyerId ?? raw.buyer_id ?? ''),
    amount:
      pickNumber(raw.offerAmount, raw.amount, raw.counterAmount) ?? 0,
    status: mapBidStatus(raw.status),
    parentBidId: pickString(raw.parentBidId, raw.parent_bid_id),
    counterAmount: pickNumber(raw.counterAmount, raw.counter_amount),
    expiresAt: pickString(raw.expiresAt, raw.expires_at),
    createdAt: pickString(raw.createdAt, raw.created_at) ?? new Date().toISOString(),
    whatsappUrl: pickString(raw.whatsappUrl, raw.whatsapp_url),
  };
}

const NOTIFICATION_TYPE_MAP: Record<string, NotificationType> = {
  new_bid: 'new_bid',
  bid_placed: 'new_bid',
  BID_PLACED: 'new_bid',
  bid_accepted: 'bid_accepted',
  BID_ACCEPTED: 'bid_accepted',
  bid_rejected: 'bid_rejected',
  BID_REJECTED: 'bid_rejected',
  bid_countered: 'bid_countered',
  BID_COUNTERED: 'bid_countered',
  bid_expiring: 'bid_expiring',
  listing_contact: 'listing_contact',
  LISTING_CONTACT: 'listing_contact',
};

export function mapNotification(rawInput: unknown): AppNotification {
  const raw = asRecord(rawInput);
  const typeKey = String(raw.type ?? raw.kind ?? '');
  return {
    id: String(raw.id ?? ''),
    userId: pickString(raw.userId, raw.user_id),
    type: NOTIFICATION_TYPE_MAP[typeKey] ?? 'unknown',
    payload: asRecord(raw.payload ?? raw.data),
    read: Boolean(raw.read ?? raw.isRead ?? raw.is_read),
    createdAt: pickString(raw.createdAt, raw.created_at) ?? new Date().toISOString(),
  };
}

export function mapIdentity(rawInput: unknown): Identity {
  const raw = asRecord(rawInput);
  const status = String(raw.status ?? 'NONE').toUpperCase() as IdentityStatus;
  return {
    status: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'].includes(status)
      ? status
      : 'NONE',
    idKind: raw.idKind ?? raw.id_kind ?? null,
    idFrontUrl: pickString(raw.idFrontUrl, raw.id_front_url),
    idBackUrl: pickString(raw.idBackUrl, raw.id_back_url),
    selfieUrl: pickString(raw.selfieUrl, raw.selfie_url),
    rejectionReason: pickString(raw.rejectionReason, raw.rejection_reason),
    listingCap: pickNumber(raw.listingCap, raw.listing_cap) ?? (status === 'APPROVED' ? 10 : 3),
  };
}

export function mapHubs(rawInput: unknown): HubsResponse {
  const raw = asRecord(rawInput);
  const categories = Array.isArray(raw.categories)
    ? raw.categories
    : [...LISTING_CATEGORIES];

  const hubs: Hub[] = [];

  const source = Array.isArray(rawInput)
    ? rawInput
    : raw.hubs ?? raw.cities ?? raw.data ?? [];

  if (Array.isArray(source)) {
    source.forEach((item: Raw) => {
      const rec = asRecord(item);
      const city = pickString(rec.city, rec.name) ?? '';
      const country = pickString(rec.country) ?? '';
      const neighborhoods = rec.neighborhoods ?? rec.locations;
      if (Array.isArray(neighborhoods) && neighborhoods.length > 0) {
        neighborhoods.forEach((n: unknown) => {
          if (typeof n === 'string') {
            hubs.push({country, city, neighborhood: n, isActive: true});
          } else {
            const nb = asRecord(n);
            hubs.push({
              id: pickString(nb.id) ?? undefined,
              country: pickString(nb.country) ?? country,
              city: pickString(nb.city) ?? city,
              neighborhood: pickString(nb.neighborhood, nb.name, nb.location) ?? '',
              isActive: nb.isActive ?? nb.is_active ?? true,
            });
          }
        });
      } else {
        hubs.push({
          id: pickString(rec.id) ?? undefined,
          country,
          city,
          neighborhood: pickString(rec.neighborhood, rec.location, rec.name) ?? '',
          isActive: rec.isActive ?? rec.is_active ?? true,
        });
      }
    });
  }

  const cities = [...new Set(hubs.map(h => h.city).filter(Boolean))];
  return {hubs, categories, cities};
}

export function mapListings(data: unknown): Listing[] {
  return extractList(data).map(mapListing);
}

export function mapBids(data: unknown, listingTitle?: string): Bid[] {
  return extractList(data).map(item => mapBid(item, listingTitle));
}

export function mapNotifications(data: unknown): AppNotification[] {
  return extractList(data).map(mapNotification);
}

export function unreadCountFrom(data: unknown, notifications: AppNotification[]): number {
  const raw = asRecord(data);
  const count = pickNumber(raw.unreadCount, raw.unread_count);
  if (count != null) return count;
  return notifications.filter(n => !n.read).length;
}
