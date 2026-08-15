export interface Hub {
  id?: string;
  country: string;
  city: string;
  neighborhood: string;
  isActive?: boolean;
}

export interface HubsResponse {
  hubs: Hub[];
  categories: string[];
  cities: string[];
}
