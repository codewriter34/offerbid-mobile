import {useCallback, useEffect, useState} from 'react';
import {useChatStore, DecryptedMessage} from '../store/chatStore';
import {useAuthStore} from '../store/authStore';
import {
  getConversation,
  listMessages,
  decryptMessage,
  sendMessage as sendChatMessage,
  markConversationRead,
  PeerChatUnavailableError,
} from '../services/chatService';
import {getLocalDeviceId} from '../services/signal';
import {ConversationDto, MessageDto} from '../types';

const PAGE_SIZE = 30;

export function useThread(conversationId: string | undefined) {
  const store = useChatStore();
  const currentUserId = useAuthStore(s => s.user?.id);
  const [conversation, setConversation] = useState<ConversationDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);

  const messages = conversationId ? store.messagesByConversation[conversationId] ?? [] : [];
  const hasMoreOlder = conversationId
    ? (store.hasMoreOlderMessages[conversationId] ?? true)
    : false;

  const decryptOne = useCallback(async (message: MessageDto): Promise<DecryptedMessage> => {
    const plaintext = await decryptMessage(message);
    return {...message, plaintext};
  }, []);

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;
    try {
      const dto = await getConversation(conversationId);
      setConversation(dto);
      store.upsertConversation(dto);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load conversation');
    }
  }, [conversationId]);

  const loadInitialMessages = useCallback(async () => {
    if (!conversationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await listMessages(conversationId, {limit: PAGE_SIZE});
      const decrypted = await Promise.all(res.data.map(decryptOne));
      store.setMessages(conversationId, decrypted, res.data.length === PAGE_SIZE);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, decryptOne]);

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || !hasMoreOlder || isLoadingOlder) return;
    const oldest = messages[0];
    if (!oldest || oldest.id.startsWith('pending-')) return;
    setIsLoadingOlder(true);
    try {
      const res = await listMessages(conversationId, {limit: PAGE_SIZE, before: oldest.id});
      const decrypted = await Promise.all(res.data.map(decryptOne));
      store.prependOlderMessages(conversationId, decrypted, res.data.length === PAGE_SIZE);
    } catch {
      // best-effort — leave hasMoreOlder as-is so a retry can happen later
    } finally {
      setIsLoadingOlder(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, hasMoreOlder, isLoadingOlder, messages, decryptOne]);

  const markRead = useCallback(async () => {
    if (!conversationId) return;
    const lastMessage = messages[messages.length - 1];
    store.setConversationUnread(conversationId, 0);
    try {
      await markConversationRead(
        conversationId,
        lastMessage && !lastMessage.id.startsWith('pending-') ? lastMessage.id : undefined,
      );
    } catch {
      // Non-critical — unread badge will self-correct on next conversation fetch
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, messages]);

  const send = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!conversationId || !conversation || !currentUserId || !trimmed) return false;

      setIsSending(true);
      setCooldownMessage(null);
      setError(null);

      const tempId = `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const localDeviceId = await getLocalDeviceId();
      const optimistic: DecryptedMessage = {
        id: tempId,
        conversationId,
        senderId: currentUserId,
        senderDeviceId: localDeviceId,
        createdAt: new Date().toISOString(),
        envelopes: [],
        plaintext: trimmed,
      };
      store.appendMessage(conversationId, optimistic);

      try {
        const res = await sendChatMessage(conversationId, conversation.peer.id, trimmed);
        store.replaceMessage(conversationId, tempId, {
          ...optimistic,
          id: res.id,
          createdAt: res.createdAt,
        });
        return true;
      } catch (err: any) {
        store.removeMessage(conversationId, tempId);
        const body = err?.response?.data;
        if (err?.response?.status === 400 && body?.code === 'CHAT_COOLDOWN') {
          setCooldownMessage(body?.message ?? 'Sending too fast — try again in a moment');
        } else if (err instanceof PeerChatUnavailableError) {
          setError(err.message);
        } else {
          setError(body?.message ?? 'Failed to send message');
        }
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId, conversation, currentUserId, store],
  );

  useEffect(() => {
    if (!conversationId) return;
    loadConversation();
    loadInitialMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return {
    conversation,
    messages,
    isLoading,
    isLoadingOlder,
    isSending,
    error,
    cooldownMessage,
    hasMoreOlder,
    send,
    markRead,
    loadOlderMessages,
    reloadConversation: loadConversation,
    appendIncomingMessage: (message: DecryptedMessage) => {
      if (conversationId) store.appendMessage(conversationId, message);
    },
  };
}
