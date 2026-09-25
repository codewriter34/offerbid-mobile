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

export async function openWhatsApp(
  params: WhatsAppMessageParams,
): Promise<boolean> {
  return openWhatsAppUrl(buildWhatsAppUrl(params));
}

// Opens an already-built wa.me URL as-is — used by the chat Thread screen's
// "Open WhatsApp" button, which is driven by the chat API's
// `peer.whatsappUrl` field (only present when the peer has opted in via
// showPhoneInChat) rather than the accepted-deal contactSeller() flow above.
export async function openWhatsAppUrl(url: string): Promise<boolean> {
  const canOpen = await Linking.canOpenURL(url);

  if (!canOpen) {
    Alert.alert(
      'WhatsApp Not Available',
      'WhatsApp is not installed on this device.',
    );
    return false;
  }

  await Linking.openURL(url);
  return true;
}
