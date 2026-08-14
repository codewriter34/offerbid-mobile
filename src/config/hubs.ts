import {Hub} from '../types';

export const HUB_CONFIG: Record<string, {city: string; neighborhoods: string[]}> = {
  Cameroon: {
    city: 'Buea',
    neighborhoods: ['Molyko', 'UB Gate', 'Sandpit', 'Mile 17'],
  },
  Nigeria: {
    city: 'Lagos',
    neighborhoods: ['Yaba', 'University of Lagos'],
  },
};

export const LISTING_CATEGORIES = [
  'Tech',
  'Electronics',
  'Furniture',
  'Household',
  'Fashion',
  'Books',
] as const;

export const MAX_ACTIVE_LISTINGS_UNVERIFIED = 3;
export const MAX_ACTIVE_BIDS_PER_ITEM = 3;
export const MAX_LISTING_IMAGES = 4;
