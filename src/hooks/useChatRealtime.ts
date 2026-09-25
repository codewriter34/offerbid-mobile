import {useEffect, useRef} from 'react';
import {
  subscribeToEvent,
  subscribeToConversation,
  unsubscribeFromConversation,
  isConnected,
} from '../services/socketClient';
import {MessageDto} from '../types';

// Mirrors the retry-until-connected pattern used elsewhere for realtime
// subscriptions (see useRealtimeBids.ts) — the socket may not be connected
// yet when a Thread screen mounts (e.g. cold start racing auth bootstrap),
// so subscribeToConversation is retried on a short timer until it is.
export function useChatRealtime(
  conversationId: string | undefined,
  onMessage: (message: MessageDto) => void,
) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    const unsubscribe = subscribeToEvent<MessageDto>('chat:message', message => {
      if (!conversationId || message.conversationId !== conversationId) return;
      onMessageRef.current(message);
    });
    return unsubscribe;
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const trySubscribe = () => {
      if (cancelled) return;
      if (isConnected()) {
        subscribeToConversation(conversationId);
      } else {
        retryTimer = setTimeout(trySubscribe, 500);
      }
    };
    trySubscribe();

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribeFromConversation(conversationId);
    };
  }, [conversationId]);
}
