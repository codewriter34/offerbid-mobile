import {create} from 'zustand';
import {Listing, ListingCategory} from '@shared/types';
import {feedCacheKey, persistFeedPage} from '@shared/lib/feedStorage';

interface ListingFilters {
  category: ListingCategory | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'recent' | 'price_asc' | 'price_desc';
  search: string;
}

interface ListingState {
  listings: Listing[];
  myListings: Listing[];
  currentListing: Listing | null;
  filters: ListingFilters;
  feedKey: string;
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;

  setListings: (listings: Listing[]) => void;
  appendListings: (listings: Listing[]) => void;
  setMyListings: (listings: Listing[]) => void;
  setCurrentListing: (listing: Listing | null) => void;
  updateListing: (id: string, partial: Partial<Listing>) => void;
  upsertListing: (listing: Listing) => void;
  removeListing: (id: string) => void;
  setFilters: (filters: Partial<ListingFilters>) => void;
  resetFilters: () => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setLoadingMore: (loadingMore: boolean) => void;
  setError: (error: string | null) => void;
  setPage: (page: number) => void;
  setHasMore: (hasMore: boolean) => void;
  reset: () => void;
}

const DEFAULT_FILTERS: ListingFilters = {
  category: null,
  minPrice: null,
  maxPrice: null,
  sortBy: 'recent',
  search: '',
};

function matchesFeedFilters(listing: Listing, filters: ListingFilters): boolean {
  if (filters.category && listing.category !== filters.category) return false;
  const query = filters.search.trim().toLowerCase();
  if (query.length >= 2) {
    const hay = `${listing.title} ${listing.description}`.toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function isActiveListing(listing: Pick<Listing, 'status'>): boolean {
  return String(listing.status ?? '').toUpperCase() === 'ACTIVE';
}

function snapshotFeed(state: Pick<ListingState, 'filters' | 'listings' | 'hasMore'>) {
  persistFeedPage(state.filters, state.listings, state.hasMore);
}

export const useListingStore = create<ListingState>(set => ({
  listings: [],
  myListings: [],
  currentListing: null,
  filters: {...DEFAULT_FILTERS},
  feedKey: feedCacheKey(DEFAULT_FILTERS),
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,

  setListings: listings =>
    set(state => ({
      listings,
      page: 1,
      feedKey: feedCacheKey(state.filters),
    })),
  appendListings: newListings =>
    set(state => ({listings: [...state.listings, ...newListings]})),
  setMyListings: myListings => set({myListings}),
  setCurrentListing: currentListing => set({currentListing}),
  updateListing: (id, partial) =>
    set(state => {
      const merge = (listing: Listing) =>
        listing.id === id ? {...listing, ...partial} : listing;
      let listings = state.listings.map(merge);
      const updated = listings.find(listing => listing.id === id);
      if (updated && !isActiveListing(updated)) {
        listings = listings.filter(listing => listing.id !== id);
      }
      const next = {
        listings,
        myListings: state.myListings.map(merge),
        currentListing:
          state.currentListing?.id === id
            ? {...state.currentListing, ...partial}
            : state.currentListing,
      };
      snapshotFeed({...state, listings});
      return next;
    }),
  upsertListing: listing =>
    set(state => {
      const visible = isActiveListing(listing) && matchesFeedFilters(listing, state.filters);
      const exists = state.listings.some(item => item.id === listing.id);
      let listings = state.listings;
      if (!visible) {
        listings = listings.filter(item => item.id !== listing.id);
      } else if (exists) {
        listings = listings.map(item =>
          item.id === listing.id ? {...item, ...listing} : item,
        );
      } else {
        listings = [listing, ...listings];
      }
      snapshotFeed({...state, listings});
      return {
        listings,
        myListings: state.myListings.map(item =>
          item.id === listing.id ? {...item, ...listing} : item,
        ),
        currentListing:
          state.currentListing?.id === listing.id
            ? {...state.currentListing, ...listing}
            : state.currentListing,
      };
    }),
  removeListing: id =>
    set(state => {
      const listings = state.listings.filter(listing => listing.id !== id);
      snapshotFeed({...state, listings});
      return {
        listings,
        myListings: state.myListings.filter(listing => listing.id !== id),
      };
    }),
  setFilters: filters =>
    set(state => ({filters: {...state.filters, ...filters}})),
  resetFilters: () => set({filters: {...DEFAULT_FILTERS}}),
  setLoading: isLoading => set({isLoading}),
  setRefreshing: isRefreshing => set({isRefreshing}),
  setLoadingMore: isLoadingMore => set({isLoadingMore}),
  setError: error => set({error}),
  setPage: page => set({page}),
  setHasMore: hasMore => set({hasMore}),
  reset: () =>
    set({
      listings: [],
      myListings: [],
      currentListing: null,
      filters: {...DEFAULT_FILTERS},
      feedKey: feedCacheKey(DEFAULT_FILTERS),
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      error: null,
      page: 1,
      hasMore: true,
    }),
}));

export function findCachedListing(id: string): Listing | null {
  if (!id) return null;
  const state = useListingStore.getState();
  if (state.currentListing?.id === id) return state.currentListing;
  return (
    state.listings.find(listing => listing.id === id) ??
    state.myListings.find(listing => listing.id === id) ??
    null
  );
}
