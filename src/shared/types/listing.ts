export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CLOSED';

export type ListingCategory = string;

export type Currency = 'XAF' | 'NGN';

export interface ListingImage {
  id?: string;
  url: string;
}

export interface ListingSeller {
  id: string | null;
  fullName: string;
  avatarUrl: string | null;
  createdAt: string | null;
}

export interface Listing {
  id: string;
  publicId: string;
  sellerId: string;
  seller: ListingSeller | null;
  category: ListingCategory | string;
  title: string;
  description: string;
  askingPrice: number;
  minBidPrice: number;
  currency: Currency | string;
  status: ListingStatus | string;
  location: string | null;
  city: string | null;
  images: ListingImage[];
  highestBidAmount: number | null;
  offerCount: number | null;
  createdAt: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  askingPrice: number;
  minBidPrice?: number;
  currency: Currency;
  category: ListingCategory;
  location: string;
  images: string[];
}
