export type ListingStatus = 'active' | 'sold' | 'withdrawn';

export type ListingCategory =
  | 'Tech'
  | 'Electronics'
  | 'Furniture'
  | 'Household'
  | 'Fashion'
  | 'Books';

export interface ListingImage {
  id: string;
  listing_id: string;
  cloudinary_url: string;
  position: number;
}

export interface Listing {
  id: string;
  seller_id: string;
  hub_id: string;
  category: ListingCategory;
  title: string;
  description: string;
  starting_price: number;
  min_bid: number;
  status: ListingStatus;
  images: ListingImage[];
  created_at: string;
}

export interface CreateListingPayload {
  hub_id: string;
  category: ListingCategory;
  title: string;
  description: string;
  starting_price: number;
  min_bid: number;
  image_urls: string[];
}
