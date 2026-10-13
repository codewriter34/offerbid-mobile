export type EnvelopeType = 'PREKEY' | 'RATCHET';

export interface ChatPeer {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  whatsappUrl: string | null;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImageUrl: string | null;
  peer: ChatPeer;
  unreadCount: number;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string;
  type: EnvelopeType;
  plaintext: string | null;
  decryptError: boolean;
  createdAt: string;
}

export interface Envelope {
  recipientUserId: string;
  recipientDeviceId: string;
  type: EnvelopeType;
  ciphertext: string;
  header?: string;
}

export interface SendMessagePayload {
  senderDeviceId: string;
  envelopes: Envelope[];
}

export interface PeerDevice {
  deviceId: string;
  identityKey: string;
  registrationId: number;
  signedPreKey: {keyId: number; publicKey: string; signature: string};
  oneTimePreKey?: {keyId: number; publicKey: string};
}

export interface KeyBundle {
  identityKey: string;
  registrationId: number;
  signedPreKey: {keyId: number; publicKey: string; signature: string};
  oneTimePreKey?: {keyId: number; publicKey: string};
  devices: PeerDevice[];
}

export interface UploadKeysPayload {
  deviceId: string;
  identityKey: string;
  registrationId: number;
  signedPreKey: {keyId: number; publicKey: string; signature: string};
  oneTimePreKeys: {keyId: number; publicKey: string}[];
}

export interface MyKeyStatus {
  registrationId: number;
  identityKey: string;
  oneTimePreKeyCount: number;
}
