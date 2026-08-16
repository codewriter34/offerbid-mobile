import {Alert, Linking} from 'react-native';

export interface WhatsAppMessageParams {
  sellerPhone: string;
  itemTitle: string;
  acceptedPrice: number;
  hubLocation: string;
  currency?: string;
}

function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '237' + cleaned.slice(1);
  }
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  return cleaned;
}

export function buildWhatsAppUrl(params: WhatsAppMessageParams): string {
  const phone = formatPhoneForWhatsApp(params.sellerPhone);
  const currencyLabel = params.currency ?? 'XAF';
  const message =
    `Hi, I'd like to confirm our deal for "${params.itemTitle}" ` +
    `at ${params.acceptedPrice} ${currencyLabel}. ` +
    `Suggested meetup: ${params.hubLocation}`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export async function openWhatsAppUrl(url: string): Promise<boolean> {
  const trimmed = url.trim();
  if (!trimmed) {
    Alert.alert(
      'WhatsApp unavailable',
      'The chat link is not ready yet. Open the accepted offer again in a moment.',
    );
    return false;
  }
  try {
    await Linking.openURL(trimmed);
    return true;
  } catch {
    Alert.alert(
      'WhatsApp Not Available',
      'WhatsApp is not installed on this device. Please install it to contact the seller.',
    );
    return false;
  }
}

export async function openDealWhatsApp(url?: string | null): Promise<boolean> {
  if (!url?.trim()) {
    Alert.alert(
      'WhatsApp unavailable',
      'The chat link is not ready yet. Open the accepted offer again in a moment.',
    );
    return false;
  }
  return openWhatsAppUrl(url);
}

export async function openWhatsApp(
  params: WhatsAppMessageParams,
): Promise<boolean> {
  if (!params.sellerPhone.trim()) {
    return openDealWhatsApp(null);
  }
  return openWhatsAppUrl(buildWhatsAppUrl(params));
}
