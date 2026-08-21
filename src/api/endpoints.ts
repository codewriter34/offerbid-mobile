import {API_BASE_URL, SOCKET_URL} from '@shared/config/env';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  SOCKET_URL: SOCKET_URL,
  TIMEOUT: 15000,
} as const;

export const ENDPOINTS = {
  AUTH: {
    GOOGLE: '/auth/google',
    REGISTER: '/auth/register',
    VERIFY_OTP: '/auth/verify-otp',
    RESEND_OTP: '/auth/resend-otp',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    ME: '/users/me',
    COMPLETE_PROFILE: '/users/complete-profile',
    AVATAR: '/users/me/avatar',
    PUBLIC_PROFILE: (id: string) => `/users/${id}/profile`,
  },
  HUBS: {
    LIST: '/hubs',
  },
  UPLOADS: {
    PRESIGN: '/uploads/presign',
  },
  IDENTITY: {
    ME: '/identity',
    SUBMIT: '/identity',
  },
  LISTINGS: {
    LIST: '/listings',
    CREATE: '/listings',
    DETAIL: (id: string) => `/listings/${id}`,
    MY_LISTINGS: '/listings/mine',
    CONTACT: (id: string) => `/listings/${id}/contact`,
    STATUS: (id: string) => `/listings/${id}/status`,
    VIEW: (id: string) => `/listings/${id}/view`,
    SIMILAR: (id: string) => `/listings/${id}/similar`,
  },
  SEARCH: '/search',
  BIDS: {
    CREATE: '/bids',
    MY_BIDS: '/bids/mine',
    LISTING_BIDS: (listingId: string) => `/listings/${listingId}/bids`,
    RESPOND: (bidId: string) => `/bids/${bidId}/respond`,
    COUNTER_RESPOND: (bidId: string) => `/bids/${bidId}/counter-respond`,
  },
  DEVICES: '/devices',
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: (id: string) => `/notifications/${id}/read`,
    READ_ALL: '/notifications/read-all',
    DELETE: (id: string) => `/notifications/${id}`,
  },
  REPORTS: '/reports',
} as const;
