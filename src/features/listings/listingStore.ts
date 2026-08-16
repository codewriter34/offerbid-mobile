import {create} from 'zustand';
import {Listing, ListingCategory} from '@shared/types';

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

export const useListingStore = create<ListingState>(set => ({
  listings: [],
  myListings: [],
  currentListing: null,
  filters: {...DEFAULT_FILTERS},
  isLoading: false,
  isRefreshing: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,

  setListings: listings => set({listings, page: 1}),
  appendListings: newListings =>
    set(state => ({listings: [...state.listings, ...newListings]})),
  setMyListings: myListings => set({myListings}),
  setCurrentListing: currentListing => set({currentListing}),
  updateListing: (id, partial) =>
    set(state => ({
      listings: state.listings.map(l =>
        l.id === id ? {...l, ...partial} : l,
      ),
      myListings: state.myListings.map(l =>
        l.id === id ? {...l, ...partial} : l,
      ),
      currentListing:
        state.currentListing?.id === id
          ? {...state.currentListing, ...partial}
          : state.currentListing,
    })),
  removeListing: id =>
    set(state => ({
      listings: state.listings.filter(l => l.id !== id),
      myListings: state.myListings.filter(l => l.id !== id),
    })),
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
      isLoading: false,
      isRefreshing: false,
      isLoadingMore: false,
      error: null,
      page: 1,
      hasMore: true,
    }),
}));
