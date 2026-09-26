import {Alert} from 'react-native';
import {User} from '../types';

export function hasWhatsAppNumber(user: User | null | undefined): boolean {
  return Boolean(user?.phone?.replace(/\D/g, ''));
}

export function promptAddWhatsApp(onOpenProfile: () => void) {
  Alert.alert(
    'Add WhatsApp',
    'Add a WhatsApp number in your profile so the other person can reach you after a deal.',
    [
      {text: 'Not now', style: 'cancel'},
      {text: 'Add number', onPress: onOpenProfile},
    ],
  );
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  const response = (err as {response?: {data?: {message?: unknown}}})?.response
    ?.data?.message;
  if (typeof response === 'string' && response.length) return response;
  if (Array.isArray(response)) return response.join(', ');
  if (
    response &&
    typeof response === 'object' &&
    'message' in response &&
    typeof (response as {message?: string}).message === 'string'
  ) {
    return (response as {message: string}).message;
  }
  const message = (err as {message?: string})?.message;
  return message || fallback;
}
