// Types for the 1:1 end-to-end-encrypted chat feature.
// Field casing intentionally matches the live API contract exactly (camelCase),
// even though most of the rest of this app's REST payloads use snake_case —
// the chat module on the API is a newer, separately-designed surface.

export type EnvelopeType = 'PREKEY' | 'RATCHET';

export interface ChatEnvelope {
  recipientUserId: string;
  recipientDeviceId: string;
  type: EnvelopeType;
  ciphertext: string; // base64
  header?: string | null; // base64, optional
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string;
  createdAt: string;
  envelopes: ChatEnvelope[];
}

export interface SendMessageResponse {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string;
  createdAt: string;
}

export interface ConversationListingSummary {
  id: string;
  title: string;
  image: string | null;
  status: string;
  askingPrice: number;
  currency: string;
}

export interface ConversationPeer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  isVerified: boolean;
  showPhoneInChat: boolean;
  phone: string | null;
  countryCode: string | null;
  whatsappUrl: string | null;
}

export interface ConversationDto {
  id: string;
  listing: ConversationListingSummary;
  peer: ConversationPeer;
  unreadCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  role: 'buyer' | 'seller';
}

export interface ConversationListResponse {
  data: ConversationDto[];
  page: number;
  limit: number;
  total: number;
}

export interface MessageListResponse {
  data: MessageDto[];
  limit: number;
}

// --- Key management (X3DH-like handshake over Olm) ---

export interface OneTimePreKeyUpload {
  keyId: number;
  publicKey: string; // base64
}

export interface UploadKeysPayload {
  deviceId: string;
  registrationId: number;
  identityKey: string; // base64
  signedPreKeyId: number;
  signedPreKey: string; // base64
  signedPreKeySig: string; // base64
  oneTimePreKeys: OneTimePreKeyUpload[];
}

export interface UploadKeysResponse {
  deviceId: string;
  registrationId: number;
  identityKey: string;
  signedPreKeyId: number;
  oneTimePreKeyCount: number;
}

export interface MyDeviceKeysSummary {
  deviceId: string;
  registrationId: number;
  oneTimePreKeyCount: number;
  updatedAt: string;
}

export interface MyKeysResponse {
  devices: MyDeviceKeysSummary[];
}

export interface PeerSignedPreKey {
  keyId: number;
  publicKey: string;
  signature: string;
}

export interface PeerOneTimePreKey {
  keyId: number;
  publicKey: string;
}

export interface PeerDeviceBundle {
  userId: string;
  deviceId: string;
  registrationId: number;
  identityKey: string;
  signedPreKey: PeerSignedPreKey;
  oneTimePreKey: PeerOneTimePreKey | null;
}

export interface PeerKeysResponse {
  userId: string;
  devices: PeerDeviceBundle[];
}

export interface ChatApiErrorBody {
  code?: 'CHAT_KEYS_MISSING' | 'CHAT_COOLDOWN' | 'CHAT_DEVICE_UNKNOWN';
  message?: string;
}
