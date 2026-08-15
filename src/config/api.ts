export const API_CONFIG = {
  BASE_URL: 'https://offerbid-api.onrender.com/api/v1',
  SOCKET_URL: 'wss://offerbid-api.onrender.com/realtime',
  TIMEOUT: 15000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    REFRESH: '/auth/refresh',
  },
  USERS: {
    ME: '/users/me',
    UPDATE: '/users/me',
    FCM_TOKEN: '/users/me/fcm-token',
  },
  HUBS: {
    LIST: '/hubs',
    SELECT: '/users/me/hub',
  },
  LISTINGS: {
    LIST: '/listings',
    CREATE: '/listings',
    DETAIL: (id: string) => `/listings/${id}`,
    MY_LISTINGS: '/listings/mine',
  },
  BIDS: {
    CREATE: '/bids',
    UPDATE: (id: string) => `/bids/${id}`,
    MY_BIDS: '/bids/mine',
    LISTING_BIDS: (listingId: string) => `/listings/${listingId}/bids`,
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
  },
} as const;
