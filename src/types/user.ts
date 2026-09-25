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
  // Chat visibility preference. Field name is camelCase (not snake_case like
  // the rest of this object) because it is defined by the chat module on the
  // API, which added it onto the existing PATCH /users/me endpoint verbatim.
  showPhoneInChat?: boolean;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface GoogleAuthPayload {
  id_token: string;
}

// Payload for PATCH /users/me. Extend this rather than adding a parallel
// update function when new editable profile fields are introduced.
export interface UpdateProfilePayload {
  display_name?: string;
  phone?: string;
  showPhoneInChat?: boolean;
}
