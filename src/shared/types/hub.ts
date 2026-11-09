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

export interface HubsResponse {
  hubs: Hub[];
  countries: CountryHub[];
  categories: string[];
  cities: string[];
  allowOther: boolean;
  otherLabel: string;
}
