import {Hub} from '@shared/types';

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

export const MAX_ACTIVE_LISTINGS_UNVERIFIED = 3;
export const MAX_ACTIVE_LISTINGS_VERIFIED = 10;
export const MAX_ACTIVE_BIDS_PER_ITEM = 3;
export const MAX_LISTING_IMAGES = 4;

export const COUNTRY_OPTIONS: Array<{
  country: 'CAMEROON' | 'NIGERIA';
  label: string;
  countryCode: string;
}> = [
  {country: 'CAMEROON', label: 'Cameroon', countryCode: '+237'},
  {country: 'NIGERIA', label: 'Nigeria', countryCode: '+234'},
];
