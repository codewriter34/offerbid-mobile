import {create} from 'zustand';
import {CountryHub, Hub, HubCategory, HubsResponse} from '@shared/types/hub';
import {fetchHubsCatalog} from './hubService';
import {getCachedHubs, setCachedHubs} from '@shared/lib/hubStorage';
import {mapHubCategories} from '@api/mappers';
import {AppLocale, getAppLocale, setAppLocale} from '@shared/lib/locale';

interface HubState {
  categories: HubCategory[];
  hubs: Hub[];
  countries: CountryHub[];
  allowOther: boolean;
  otherLabel: string;
  locale: AppLocale;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  hydrate: () => Promise<void>;
  refresh: (locale?: AppLocale) => Promise<void>;
  /** Update app language and refetch hubs so labels / otherLabel match. */
  setLocale: (locale: AppLocale) => Promise<void>;
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

function normalizeCatalog(catalog: HubsResponse): HubsResponse {
  return {
    ...catalog,
    categories: mapHubCategories(catalog.categories),
  };
}

function applyCatalog(
  catalog: HubsResponse,
): Pick<HubState, 'categories' | 'hubs' | 'countries' | 'allowOther' | 'otherLabel'> {
  const normalized = normalizeCatalog(catalog);
  return {
    categories: normalized.categories,
    hubs: normalized.hubs,
    countries: normalized.countries ?? [],
    allowOther: normalized.allowOther,
    otherLabel: normalized.otherLabel || 'Other',
  };
}

export const useHubStore = create<HubState>((set, get) => ({
  ...EMPTY,
  locale: getAppLocale(),
  isHydrated: false,
  isLoading: false,
  error: null,

  hydrate: async () => {
    const locale = getAppLocale();
    const cached = await getCachedHubs();
    if (cached) {
      set({
        ...applyCatalog(cached),
        locale: cached.locale ?? locale,
        isHydrated: true,
        error: null,
      });
    }
    set({isLoading: true, locale});
    try {
      const catalog = await fetchHubsCatalog(locale);
      set({
        ...applyCatalog(catalog),
        locale,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
      void setCachedHubs(catalog, locale);
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

  refresh: async (nextLocale?: AppLocale) => {
    const locale = nextLocale ?? get().locale ?? getAppLocale();
    if (nextLocale) setAppLocale(nextLocale);
    set({isLoading: true, error: null, locale});
    try {
      const catalog = await fetchHubsCatalog(locale);
      set({
        ...applyCatalog(catalog),
        locale,
        isHydrated: true,
        isLoading: false,
        error: null,
      });
      void setCachedHubs(catalog, locale);
    } catch (err: any) {
      set({
        isLoading: false,
        error: err?.response?.data?.message ?? 'Failed to load locations',
      });
    }
  },

  setLocale: async (locale: AppLocale) => {
    setAppLocale(locale);
    await get().refresh(locale);
  },
}));
