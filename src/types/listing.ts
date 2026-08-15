export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CLOSED';

export type ListingCategory =
  | 'Tech'
  | 'Electronics'
  | 'Furniture'
  | 'Household'
  | 'Fashion'
  | 'Books';

export type Currency = 'XAF' | 'NGN';

export interface ListingImage {
  id?: string;
  url: string;
}

export interface Listing {
  id: string;
  sellerId: string;
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
  createdAt: string;
}

export interface CreateListingPayload {
  title: string;
  description: string;
  askingPrice: number;
  minBidPrice: number;
  currency: Currency;
  category: ListingCategory;
  location: string;
  images: string[];
}
