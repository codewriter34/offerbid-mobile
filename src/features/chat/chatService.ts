import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {
  Conversation,
  ChatMessage,
  KeyBundle,
  UploadKeysPayload,
  MyKeyStatus,
  SendMessagePayload,
  Envelope,
} from './chatTypes';
import {mapConversation, mapChatMessage, mapKeyBundle, mapMyKeyStatus} from './chatMappers';

export async function createConversation(listingId: string): Promise<Conversation> {
  const {data} = await apiClient.post(ENDPOINTS.CHAT.CREATE, {listingId});
  return mapConversation(data);
}

export async function fetchInbox(page = 1, limit = 20): Promise<Conversation[]> {
  const {data} = await apiClient.get(ENDPOINTS.CHAT.INBOX, {params: {page, limit}});
  const list = Array.isArray(data) ? data : data?.conversations ?? data?.data ?? [];
  return list.map(mapConversation);
}

export async function fetchConversation(conversationId: string): Promise<Conversation> {
  const {data} = await apiClient.get(ENDPOINTS.CHAT.DETAIL(conversationId));
  return mapConversation(data);
}

export async function markRead(conversationId: string): Promise<void> {
  await apiClient.patch(ENDPOINTS.CHAT.READ(conversationId));
}

export async function uploadKeys(payload: UploadKeysPayload): Promise<void> {
  await apiClient.post(ENDPOINTS.CHAT.KEYS_UPLOAD, payload);
}

export async function fetchMyKeyStatus(): Promise<MyKeyStatus> {
  const {data} = await apiClient.get(ENDPOINTS.CHAT.KEYS_ME);
  return mapMyKeyStatus(data);
}

export async function fetchPeerKeyBundle(peerUserId: string): Promise<KeyBundle> {
  const {data} = await apiClient.get(ENDPOINTS.CHAT.KEYS_PEER(peerUserId));
  return mapKeyBundle(data);
}

export async function sendMessage(
  conversationId: string,
  payload: SendMessagePayload,
): Promise<ChatMessage> {
  const {data} = await apiClient.post(
    ENDPOINTS.CHAT.SEND_MESSAGE(conversationId),
    payload,
  );
  return mapChatMessage(data);
}

export async function fetchMessages(
  conversationId: string,
  limit = 30,
  before?: string,
): Promise<ChatMessage[]> {
  const params: Record<string, unknown> = {limit};
  if (before) params.before = before;
  const {data} = await apiClient.get(ENDPOINTS.CHAT.MESSAGES(conversationId), {params});
  const list = Array.isArray(data) ? data : data?.messages ?? data?.data ?? [];
  return list.map(mapChatMessage);
}

export async function replenishOneTimePreKeys(
  keys: {keyId: number; publicKey: string}[],
): Promise<void> {
  await apiClient.post(ENDPOINTS.CHAT.KEYS_UPLOAD, {oneTimePreKeys: keys});
}
