export interface Hub {
  id?: string;
  country: string;
  city: string;
  neighborhood: string;
  isActive?: boolean;
}

export interface CountryHub {
  country: string;
  currency: string;
  countryCode: string;
  cities: Record<string, string[]>;
}

export interface HubCategory {
  /** Stable English key. Always send this on create / edit / filter / search. */
  value: string;
  /** Localized label for the requested locale. */
  label: string;
  labels: {
    en: string;
    fr: string;
  };
}

export interface HubsResponse {
  hubs: Hub[];
  countries: CountryHub[];
  categories: HubCategory[];
  cities: string[];
  allowOther: boolean;
  otherLabel: string;
}
