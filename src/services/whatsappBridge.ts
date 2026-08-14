import {Linking} from 'react-native';

interface WhatsAppMessageParams {
  sellerPhone: string;
  itemTitle: string;
  acceptedPrice: number;
  hubLocation: string;
}

export function buildWhatsAppUrl(params: WhatsAppMessageParams): string {
  const message = `Hi, I'd like to confirm our deal for ${params.itemTitle} at ${params.acceptedPrice}. Suggested meetup: ${params.hubLocation}`;
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${params.sellerPhone}?text=${encoded}`;
}

export async function openWhatsApp(params: WhatsAppMessageParams): Promise<void> {
  const url = buildWhatsAppUrl(params);
  const canOpen = await Linking.canOpenURL(url);
  if (canOpen) {
    await Linking.openURL(url);
  }
}
