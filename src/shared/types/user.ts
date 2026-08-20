export type Country = 'CAMEROON' | 'NIGERIA';
export type PrimaryIntent = 'BUY' | 'SELL' | 'BOTH';

export interface User {
  id: string;
  email: string | null;
  fullName: string;
  phone: string | null;
  countryCode: string | null;
  country: Country | string | null;
  primaryIntent?: PrimaryIntent | string | null;
  city: string | null;
  address: string | null;
  location: string | null;
  avatarUrl: string | null;
  profileComplete: boolean;
  isVerified: boolean;
  googleId: string | null;
  createdAt: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName: string;
  countryCode: string;
  phone: string;
  country: Country;
  primaryIntent?: PrimaryIntent;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  code: string;
  purpose?: 'EMAIL_VERIFY' | 'PASSWORD_RESET';
}

export interface CompleteProfilePayload {
  city: string;
  address: string;
  location: string;
}

export interface GoogleAuthPayload {
  idToken: string;
}
