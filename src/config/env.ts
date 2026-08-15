import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const IS_EXPO_GO =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === 'storeClient';

export const API_BASE_URL =
  extra.apiBaseUrl ??
  process.env.API_BASE_URL ??
  'https://offerbid-api.onrender.com/api/v1';

export const SOCKET_URL =
  extra.socketUrl ??
  process.env.SOCKET_URL ??
  'wss://offerbid-api.onrender.com/realtime';

export const GOOGLE_WEB_CLIENT_ID =
  extra.googleWebClientId ?? process.env.GOOGLE_WEB_CLIENT_ID ?? '';

export const CLOUDINARY_CLOUD_NAME =
  extra.cloudinaryCloudName ?? process.env.CLOUDINARY_CLOUD_NAME ?? '';

export const CLOUDINARY_UPLOAD_PRESET =
  extra.cloudinaryUploadPreset ?? process.env.CLOUDINARY_UPLOAD_PRESET ?? '';

export const UPLOAD_PROVIDER =
  (extra.uploadProvider as 's3' | 'cloudinary' | undefined) ??
  (process.env.UPLOAD_PROVIDER as 's3' | 'cloudinary' | undefined) ??
  's3';
