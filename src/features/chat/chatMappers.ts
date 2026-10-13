import {Conversation, ChatMessage, KeyBundle, MyKeyStatus, PeerDevice} from './chatTypes';

type Raw = Record<string, any>;

function str(v: unknown): string {
  return String(v ?? '');
}
function pick(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return null;
}

export function mapConversation(raw: Raw): Conversation {
  const peer = raw.peer ?? raw.otherUser ?? raw.otherParticipant ?? {};
  return {
    id: str(raw.id),
    listingId: str(raw.listingId ?? raw.listing_id),
    listingTitle: pick(raw.listingTitle, raw.listing?.title) ?? '',
    listingImageUrl:
      pick(raw.listingImageUrl, raw.listing?.imageUrl, raw.listing?.images?.[0]?.url) ?? null,
    peer: {
      id: str(peer.id),
      fullName: pick(peer.fullName, peer.full_name, peer.name) ?? 'User',
      avatarUrl: pick(peer.avatarUrl, peer.avatar_url, peer.avatar) ?? null,
      whatsappUrl: pick(peer.whatsappUrl, peer.whatsapp_url) ?? null,
    },
    unreadCount: Number(raw.unreadCount ?? raw.unread_count ?? 0),
    lastMessageAt: pick(raw.lastMessageAt, raw.last_message_at) ?? null,
    lastMessagePreview: pick(raw.lastMessagePreview, raw.last_message_preview) ?? null,
  };
}

export function mapChatMessage(raw: Raw): ChatMessage {
  return {
    id: str(raw.id),
    conversationId: str(raw.conversationId ?? raw.conversation_id),
    senderId: str(raw.senderId ?? raw.sender_id),
    senderDeviceId: str(raw.senderDeviceId ?? raw.sender_device_id),
    type: raw.type === 'PREKEY' ? 'PREKEY' : 'RATCHET',
    plaintext: null,
    decryptError: false,
    createdAt: pick(raw.createdAt, raw.created_at) ?? new Date().toISOString(),
  };
}

function mapPeerDevice(raw: Raw): PeerDevice {
  const spk = raw.signedPreKey ?? raw.signed_pre_key ?? {};
  const otpk = raw.oneTimePreKey ?? raw.one_time_pre_key;
  return {
    deviceId: str(raw.deviceId ?? raw.device_id),
    identityKey: str(raw.identityKey ?? raw.identity_key),
    registrationId: Number(raw.registrationId ?? raw.registration_id ?? 0),
    signedPreKey: {
      keyId: Number(spk.keyId ?? spk.key_id ?? 0),
      publicKey: str(spk.publicKey ?? spk.public_key),
      signature: str(spk.signature),
    },
    oneTimePreKey: otpk
      ? {keyId: Number(otpk.keyId ?? otpk.key_id ?? 0), publicKey: str(otpk.publicKey ?? otpk.public_key)}
      : undefined,
  };
}

export function mapKeyBundle(raw: Raw): KeyBundle {
  const spk = raw.signedPreKey ?? raw.signed_pre_key ?? {};
  const otpk = raw.oneTimePreKey ?? raw.one_time_pre_key;
  const devices: PeerDevice[] = Array.isArray(raw.devices)
    ? raw.devices.map(mapPeerDevice)
    : [mapPeerDevice(raw)];
  return {
    identityKey: str(raw.identityKey ?? raw.identity_key),
    registrationId: Number(raw.registrationId ?? raw.registration_id ?? 0),
    signedPreKey: {
      keyId: Number(spk.keyId ?? spk.key_id ?? 0),
      publicKey: str(spk.publicKey ?? spk.public_key),
      signature: str(spk.signature),
    },
    oneTimePreKey: otpk
      ? {keyId: Number(otpk.keyId ?? otpk.key_id ?? 0), publicKey: str(otpk.publicKey ?? otpk.public_key)}
      : undefined,
    devices,
  };
}

export function mapMyKeyStatus(raw: Raw): MyKeyStatus {
  return {
    registrationId: Number(raw.registrationId ?? raw.registration_id ?? 0),
    identityKey: str(raw.identityKey ?? raw.identity_key),
    oneTimePreKeyCount: Number(raw.oneTimePreKeyCount ?? raw.one_time_pre_key_count ?? 0),
  };
}
