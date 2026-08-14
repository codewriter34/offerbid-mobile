export interface User {
  id: string;
  google_id: string;
  display_name: string;
  phone: string | null;
  hub_id: string | null;
  is_verified: boolean;
  active_listing_count: number;
  fcm_token: string | null;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface GoogleAuthPayload {
  id_token: string;
}
