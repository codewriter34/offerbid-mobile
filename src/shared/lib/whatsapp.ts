import {Alert, Linking} from 'react-native';
import {contactSeller} from '@features/listings/listingService';
import {Bid} from '@shared/types';

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
      'The chat link is missing for this deal. Pull to refresh, then try again.',
    );
    return false;
  }
  try {
    await Linking.openURL(trimmed);
    return true;
  } catch {
    Alert.alert(
      'WhatsApp Not Available',
      'WhatsApp is not installed on this device. Please install it to continue the chat.',
    );
    return false;
  }
}

export async function openDealWhatsApp(url?: string | null): Promise<boolean> {
  if (!url?.trim()) {
    Alert.alert(
      'WhatsApp unavailable',
      'The chat link is missing for this deal. Pull to refresh, then try again.',
    );
    return false;
  }
  return openWhatsAppUrl(url);
}

/** Prefer the bid's stored link; otherwise ask the API for a contact link. */
export async function openAcceptedDealWhatsApp(
  bid: Bid,
  listingId?: string,
): Promise<boolean> {
  if (bid.whatsappUrl?.trim()) {
    return openWhatsAppUrl(bid.whatsappUrl);
  }
  const id = listingId || bid.listingId;
  if (id) {
    try {
      const url = await contactSeller(id);
      return openWhatsAppUrl(url);
    } catch (err: any) {
      Alert.alert(
        'WhatsApp unavailable',
        err?.response?.data?.message ??
          err?.message ??
          'Could not open the chat link. Try again in a moment.',
      );
      return false;
    }
  }
  return openDealWhatsApp(null);
}

export async function openWhatsApp(
  params: WhatsAppMessageParams,
): Promise<boolean> {
  if (!params.sellerPhone.trim()) {
    return openDealWhatsApp(null);
  }
  return openWhatsAppUrl(buildWhatsAppUrl(params));
}
