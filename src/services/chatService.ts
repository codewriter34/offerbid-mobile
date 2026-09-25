import apiClient from './apiClient';
import {ENDPOINTS} from '../config/api';
import * as signal from './signal';
import {
  ChatApiErrorBody,
  ChatEnvelope,
  ConversationDto,
  ConversationListResponse,
  MessageDto,
  MessageListResponse,
  MyKeysResponse,
  PeerDeviceBundle,
  PeerKeysResponse,
  SendMessageResponse,
  UploadKeysResponse,
} from '../types/chat';

export class PeerChatUnavailableError extends Error {}

const LOW_OTPK_THRESHOLD = 10;

// In-memory cache of the peer's device bundle, per peerUserId. Deliberately
// not persisted — it holds one-time prekeys that the server has already
// handed out to us, so keeping it around only in memory for this app session
// is fine, and avoids ever re-serving a consumed OTPK to a second local
// caller by accident.
const peerDeviceCache = new Map<string, PeerDeviceBundle[]>();

export async function uploadDeviceKeys(batchSize?: number): Promise<UploadKeysResponse> {
  const payload = await signal.buildKeyUploadPayload(batchSize);
  const {data} = await apiClient.post<UploadKeysResponse>(ENDPOINTS.CHATS.KEYS_UPLOAD, payload);
  await signal.recordKeyUploadSuccess();
  return data;
}

export async function getMyKeys(): Promise<MyKeysResponse> {
  const {data} = await apiClient.get<MyKeysResponse>(ENDPOINTS.CHATS.KEYS_ME);
  return data;
}

// Called once a session is bootstrapped (see useAuth.ts): makes sure this
// device has a registered key bundle, and replenishes the one-time-prekey
// pool if it's running low.
export async function ensureChatKeysReady(): Promise<void> {
  const localDeviceId = await signal.getLocalDeviceId();
  try {
    const mine = await getMyKeys();
    const myDevice = mine.devices.find(d => d.deviceId === localDeviceId);
    if (myDevice && myDevice.oneTimePreKeyCount >= LOW_OTPK_THRESHOLD) {
      return;
    }
  } catch {
    // Fall through to upload — most commonly this is a brand-new device
    // that GET /chats/keys/me doesn't know about yet.
  }
  await uploadDeviceKeys();
}

async function fetchPeerDevices(
  peerUserId: string,
  opts: {force?: boolean} = {},
): Promise<PeerDeviceBundle[]> {
  if (!opts.force && peerDeviceCache.has(peerUserId)) {
    return peerDeviceCache.get(peerUserId)!;
  }
  try {
    const {data} = await apiClient.get<PeerKeysResponse>(ENDPOINTS.CHATS.KEYS_FOR_PEER(peerUserId));
    peerDeviceCache.set(peerUserId, data.devices);
    return data.devices;
  } catch (err: any) {
    const body: ChatApiErrorBody | undefined = err?.response?.data;
    if (err?.response?.status === 409 && body?.code === 'CHAT_KEYS_MISSING') {
      throw new PeerChatUnavailableError(body?.message ?? 'They have not enabled chat yet');
    }
    throw err;
  }
}

async function encryptForAllDevices(
  peerUserId: string,
  devices: PeerDeviceBundle[],
  plaintext: string,
): Promise<ChatEnvelope[]> {
  const envelopes: ChatEnvelope[] = [];
  for (const device of devices) {
    envelopes.push(await signal.encryptForDevice(peerUserId, device, plaintext));
  }
  return envelopes;
}

async function postMessage(
  conversationId: string,
  senderDeviceId: string,
  envelopes: ChatEnvelope[],
): Promise<SendMessageResponse> {
  const {data} = await apiClient.post<SendMessageResponse>(ENDPOINTS.CHATS.MESSAGES(conversationId), {
    senderDeviceId,
    envelopes,
  });
  return data;
}

// Sends `plaintext` end-to-end encrypted to every device the peer currently
// has registered. Only re-fetches the peer's key bundle (which consumes a
// scarce one-time prekey per device) when we have no cached bundle yet, or
// when the server tells us our envelope set is stale (a plain 400 with no
// error code — see src/types/chat.ts's ChatApiErrorBody: CHAT_COOLDOWN and
// CHAT_DEVICE_UNKNOWN both carry a `code`, but "missing envelope for a
// device" does not, per the live contract) or our own keys are unknown to
// the server (CHAT_DEVICE_UNKNOWN).
export async function sendMessage(
  conversationId: string,
  peerUserId: string,
  plaintext: string,
): Promise<SendMessageResponse> {
  const senderDeviceId = await signal.getLocalDeviceId();
  const devices = await fetchPeerDevices(peerUserId);
  if (devices.length === 0) {
    throw new PeerChatUnavailableError('They have not enabled chat yet');
  }
  const envelopes = await encryptForAllDevices(peerUserId, devices, plaintext);

  try {
    return await postMessage(conversationId, senderDeviceId, envelopes);
  } catch (err: any) {
    const status = err?.response?.status;
    const body: ChatApiErrorBody | undefined = err?.response?.data;

    if (status === 400 && body?.code === 'CHAT_DEVICE_UNKNOWN') {
      await uploadDeviceKeys();
      return postMessage(conversationId, senderDeviceId, envelopes);
    }

    if (status === 409 && body?.code === 'CHAT_KEYS_MISSING') {
      throw new PeerChatUnavailableError(body?.message ?? 'They have not enabled chat yet');
    }

    if (status === 400 && body?.code === 'CHAT_COOLDOWN') {
      // Caller surfaces this as a friendly inline "sending too fast, hold
      // on" retry rather than a hard error — rethrow as-is.
      throw err;
    }

    if (status === 400 && !body?.code) {
      // Peer likely registered a new device since our last fetch — force a
      // fresh bundle and retry exactly once.
      const freshDevices = await fetchPeerDevices(peerUserId, {force: true});
      const freshEnvelopes = await encryptForAllDevices(peerUserId, freshDevices, plaintext);
      return postMessage(conversationId, senderDeviceId, freshEnvelopes);
    }

    throw err;
  }
}

// Decrypts the single envelope in `message.envelopes` addressed to this
// device (the server pre-filters envelopes to only the caller's own
// devices). Returns null — never throws — on failure, so a single
// undecryptable message can't break the rest of a thread; only envelope
// metadata is logged, never plaintext or ciphertext.
export async function decryptMessage(message: MessageDto): Promise<string | null> {
  const localDeviceId = await signal.getLocalDeviceId();
  const envelope = message.envelopes.find(e => e.recipientDeviceId === localDeviceId);
  if (!envelope) {
    return null;
  }
  try {
    return await signal.decryptEnvelope(envelope, message.senderId, message.senderDeviceId);
  } catch {
    console.warn('[chat] failed to decrypt message', {
      messageId: message.id,
      senderDeviceId: message.senderDeviceId,
      envelopeType: envelope.type,
    });
    return null;
  }
}

export async function listConversations(
  page = 1,
  limit = 20,
): Promise<ConversationListResponse> {
  const {data} = await apiClient.get<ConversationListResponse>(ENDPOINTS.CHATS.LIST, {
    params: {page, limit},
  });
  return data;
}

export async function createConversation(listingId: string): Promise<ConversationDto> {
  const {data} = await apiClient.post<ConversationDto>(ENDPOINTS.CHATS.CREATE, {listingId});
  return data;
}

export async function getConversation(id: string): Promise<ConversationDto> {
  const {data} = await apiClient.get<ConversationDto>(ENDPOINTS.CHATS.DETAIL(id));
  return data;
}

export async function listMessages(
  conversationId: string,
  opts: {before?: string; limit?: number} = {},
): Promise<MessageListResponse> {
  const {data} = await apiClient.get<MessageListResponse>(ENDPOINTS.CHATS.MESSAGES(conversationId), {
    params: {limit: opts.limit ?? 30, before: opts.before},
  });
  return data;
}

export async function markConversationRead(
  conversationId: string,
  lastMessageId?: string,
): Promise<{conversationId: string; unreadCount: number}> {
  const {data} = await apiClient.patch(
    ENDPOINTS.CHATS.READ(conversationId),
    lastMessageId ? {lastMessageId} : {},
  );
  return data;
}
