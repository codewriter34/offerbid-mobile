import {useCallback, useState} from 'react';
import {useChatStore} from './chatStore';
import * as chatService from './chatService';
import {
  encryptForAllPeerDevices,
  initSessionFromBundle,
} from './chatCrypto';
import {getOrCreateDeviceId, loadPeerDeviceIds} from './chatKeyStorage';
import {uploadKeysIfNeeded} from './chatKeySetup';
import {ChatMessage, Conversation} from './chatTypes';

export function useChat() {
  const store = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(false);

  // ── Inbox ──────────────────────────────────────────────────────────────────

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const conversations = await chatService.fetchInbox();
      store.setConversations(conversations);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Open / create conversation ─────────────────────────────────────────────

  const openOrCreateChat = useCallback(
    async (listingId: string): Promise<Conversation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const conv = await chatService.createConversation(listingId);
        store.upsertConversation(conv);
        return conv;
      } catch (err: any) {
        const code = err?.response?.data?.code;
        if (code === 'CHAT_KEYS_MISSING') {
          setError('CHAT_KEYS_MISSING');
        } else {
          setError(err?.response?.data?.message ?? err.message);
        }
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // ── Load messages ──────────────────────────────────────────────────────────

  const loadMessages = useCallback(async (conversationId: string) => {
    setIsLoading(true);
    try {
      const msgs = await chatService.fetchMessages(conversationId);
      store.setMessages(conversationId, msgs);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMoreMessages = useCallback(
    async (conversationId: string, oldestId: string) => {
      try {
        const msgs = await chatService.fetchMessages(conversationId, 30, oldestId);
        store.prependMessages(conversationId, msgs);
      } catch {}
    },
    [],
  );

  // ── Send ───────────────────────────────────────────────────────────────────

  const sendChatMessage = useCallback(
    async (conversationId: string, peerUserId: string, plaintext: string): Promise<boolean> => {
      if (cooldown || isSending) return false;
      setIsSending(true);
      setCooldown(true);
      setTimeout(() => setCooldown(false), 450);

      try {
        const deviceId = await getOrCreateDeviceId();

        // Ensure session exists for peer
        const peerDevices = await loadPeerDeviceIds(peerUserId);
        if (peerDevices.length === 0) {
          let bundle;
          try {
            bundle = await chatService.fetchPeerKeyBundle(peerUserId);
          } catch (err: any) {
            const code = err?.response?.data?.code;
            if (code === 'CHAT_KEYS_MISSING') {
              setError('CHAT_KEYS_MISSING');
            } else if (code === 'CHAT_DEVICE_UNKNOWN') {
              await uploadKeysIfNeeded();
              setError('CHAT_DEVICE_UNKNOWN');
            } else {
              setError(err?.response?.data?.message ?? err.message);
            }
            return false;
          }
          await initSessionFromBundle(peerUserId, bundle);
        }

        const envelopes = await encryptForAllPeerDevices(peerUserId, plaintext);
        const sent = await chatService.sendMessage(conversationId, {
          senderDeviceId: deviceId,
          envelopes,
        });

        // Optimistically show as own message with plaintext
        store.appendMessage({...sent, senderId: peerUserId, plaintext, decryptError: false});
        return true;
      } catch (err: any) {
        const code = err?.response?.data?.code;
        if (code === 'CHAT_COOLDOWN') {
          // button already disabled via cooldown state
        } else if (code === 'CHAT_DEVICE_UNKNOWN') {
          await uploadKeysIfNeeded();
          setError('CHAT_DEVICE_UNKNOWN');
        } else {
          setError(err?.response?.data?.message ?? err.message);
        }
        return false;
      } finally {
        setIsSending(false);
      }
    },
    [cooldown, isSending, uploadKeysIfNeeded],
  );

  // ── Mark read ──────────────────────────────────────────────────────────────

  const markChatRead = useCallback(async (conversationId: string) => {
    store.markConversationRead(conversationId);
    try {
      await chatService.markRead(conversationId);
    } catch {}
  }, []);

  return {
    conversations: store.conversations,
    messages: store.messages,
    unreadTotal: store.unreadTotal,
    keysUploaded: store.keysUploaded,
    isLoading,
    isSending,
    cooldown,
    error,
    uploadKeysIfNeeded,
    fetchInbox,
    openOrCreateChat,
    loadMessages,
    loadMoreMessages,
    sendChatMessage,
    markChatRead,
  };
}
