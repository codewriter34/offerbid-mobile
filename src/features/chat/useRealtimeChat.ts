import {useEffect, useRef} from 'react';
import {getSocket, emitEvent, subscribeToEvent} from '@shared/lib/socket';
import {useChatStore} from './chatStore';
import {decryptEnvelope} from './chatCrypto';
import {getOrCreateDeviceId} from './chatKeyStorage';
import {mapChatMessage} from './chatMappers';
import {Envelope} from './chatTypes';

interface ChatMessagePayload {
  id: string;
  conversationId: string;
  senderId: string;
  senderDeviceId: string;
  createdAt: string;
  envelopes: (Envelope & {recipientDeviceId: string})[];
}

export function useRealtimeChat(conversationId: string | null) {
  const store = useChatStore();
  const retryRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!conversationId) return;

    const setup = async () => {
      const myDeviceId = await getOrCreateDeviceId();

      const attach = () => {
        const socket = getSocket();
        if (!socket) return false;

        emitEvent('subscribeToConversation', {conversationId});

        unsubRef.current = subscribeToEvent(
          'chat:message',
          async (payload: ChatMessagePayload) => {
            if (payload.conversationId !== conversationId) return;

            // Find envelope for this device
            const envelope = payload.envelopes.find(
              e => e.recipientDeviceId === myDeviceId,
            );
            const base = mapChatMessage({
              id: payload.id,
              conversationId: payload.conversationId,
              senderId: payload.senderId,
              senderDeviceId: payload.senderDeviceId,
              type: envelope?.type ?? 'RATCHET',
              createdAt: payload.createdAt,
            });

            if (!envelope) {
              store.appendMessage({...base, decryptError: true});
              return;
            }

            try {
              const plaintext = await decryptEnvelope(
                payload.senderId,
                payload.senderDeviceId,
                envelope.type,
                envelope.ciphertext,
              );
              store.appendMessage({...base, plaintext, decryptError: false});
            } catch {
              store.appendMessage({...base, decryptError: true});
            }
          },
        );
        return true;
      };

      if (!attach()) {
        retryRef.current = setInterval(() => {
          if (attach() && retryRef.current) {
            clearInterval(retryRef.current);
            retryRef.current = null;
          }
        }, 400);
      }
    };

    void setup();

    return () => {
      if (retryRef.current) clearInterval(retryRef.current);
      if (unsubRef.current) unsubRef.current();
      if (conversationId) {
        emitEvent('unsubscribeFromConversation', {conversationId});
      }
    };
  }, [conversationId]);
}
