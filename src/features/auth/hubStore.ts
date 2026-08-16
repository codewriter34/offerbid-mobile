import {create} from 'zustand';
import {CountryHub, Hub, HubsResponse} from '@shared/types/hub';
import {fetchHubsCatalog} from './hubService';
import {getCachedHubs, setCachedHubs} from '@shared/lib/hubStorage';

interface HubState {
  categories: string[];
  hubs: Hub[];
  countries: CountryHub[];
  allowOther: boolean;
  otherLabel: string;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  refresh: () => Promise<void>;
}

const EMPTY: Pick<
  HubState,
  'categories' | 'hubs' | 'countries' | 'allowOther' | 'otherLabel'
> = {
  categories: [],
  hubs: [],
  countries: [],
  allowOther: true,
  otherLabel: 'Other',
};

function applyCatalog(
  catalog: HubsResponse,
): Pick<HubState, 'categories' | 'hubs' | 'countries' | 'allowOther' | 'otherLabel'> {
  return {
    categories: catalog.categories,
    hubs: catalog.hubs,
    countries: catalog.countries ?? [],
    allowOther: catalog.allowOther,
    otherLabel: catalog.otherLabel || 'Other',
  };
}

export const useHubStore = create<HubState>(set => ({
  ...EMPTY,
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    const cached = await getCachedHubs();
    if (cached) {
      set({...applyCatalog(cached), isHydrated: true, error: null});
    }
    set({isLoading: true});
    try {
      const catalog = await fetchHubsCatalog();
      set({...applyCatalog(catalog), isHydrated: true, isLoading: false, error: null});
      void setCachedHubs(catalog);
    } catch (err: any) {
      set({
        isHydrated: true,
        isLoading: false,
        error: cached
          ? null
          : err?.response?.data?.message ?? 'Failed to load locations',
      });
    }
  },

  refresh: async () => {
    set({isLoading: true, error: null});
    try {
      const catalog = await fetchHubsCatalog();
      set({...applyCatalog(catalog), isHydrated: true, isLoading: false, error: null});
      void setCachedHubs(catalog);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message ?? 'Failed to load locations',
      });
    }
  },
}));
