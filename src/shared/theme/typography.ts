import {TextStyle} from 'react-native';

export const fontFamily = {
  sans: undefined as string | undefined,
} as const;

export const typography: Record<string, TextStyle> = {
  h1: {
    fontFamily: fontFamily.sans,
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
    color: '#0F172A',
  },
  h2: {
    fontFamily: fontFamily.sans,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 28,
    color: '#0F172A',
  },
  h3: {
    fontFamily: fontFamily.sans,
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#0F172A',
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
    color: '#334155',
  },
  bodySmall: {
    fontFamily: fontFamily.sans,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: '#334155',
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: '#64748B',
  },
  nav: {
    fontFamily: fontFamily.sans,
    fontSize: 10,
    fontWeight: '600',
    lineHeight: 12,
  },
  button: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  price: {
    fontFamily: fontFamily.sans,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
    color: '#0F172A',
  },
};
