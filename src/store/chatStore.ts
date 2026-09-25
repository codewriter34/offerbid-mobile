import {create} from 'zustand';
import {ConversationDto, MessageDto} from '../types';

export interface DecryptedMessage extends MessageDto {
  // null means decryption failed (or no envelope addressed to this device
  // was found) — rendered as an "unable to decrypt" placeholder, never as
  // empty/blank text so a failure isn't mistaken for an empty message.
  plaintext: string | null;
}

interface ChatState {
  conversations: ConversationDto[];
  conversationsPage: number;
  conversationsTotal: number;
  isLoadingConversations: boolean;
  conversationsError: string | null;

  messagesByConversation: Record<string, DecryptedMessage[]>;
  hasMoreOlderMessages: Record<string, boolean>;

  setConversations: (conversations: ConversationDto[], page: number, total: number) => void;
  appendConversations: (conversations: ConversationDto[], page: number, total: number) => void;
  upsertConversation: (conversation: ConversationDto) => void;
  setConversationUnread: (conversationId: string, unreadCount: number) => void;
  setConversationsLoading: (loading: boolean) => void;
  setConversationsError: (error: string | null) => void;

  setMessages: (conversationId: string, messages: DecryptedMessage[], hasMoreOlder: boolean) => void;
  prependOlderMessages: (conversationId: string, messages: DecryptedMessage[], hasMoreOlder: boolean) => void;
  appendMessage: (conversationId: string, message: DecryptedMessage) => void;
  replaceMessage: (conversationId: string, tempId: string, message: DecryptedMessage) => void;
  removeMessage: (conversationId: string, id: string) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  conversationsPage: 1,
  conversationsTotal: 0,
  isLoadingConversations: false,
  conversationsError: null,

  messagesByConversation: {},
  hasMoreOlderMessages: {},

  setConversations: (conversations, page, total) =>
    set({conversations, conversationsPage: page, conversationsTotal: total}),

  appendConversations: (conversations, page, total) =>
    set(state => ({
      conversations: [...state.conversations, ...conversations],
      conversationsPage: page,
      conversationsTotal: total,
    })),

  upsertConversation: conversation =>
    set(state => {
      const idx = state.conversations.findIndex(c => c.id === conversation.id);
      if (idx === -1) {
        return {conversations: [conversation, ...state.conversations]};
      }
      const next = [...state.conversations];
      next[idx] = conversation;
      return {conversations: next};
    }),

  setConversationUnread: (conversationId, unreadCount) =>
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? {...c, unreadCount} : c,
      ),
    })),

  setConversationsLoading: isLoadingConversations => set({isLoadingConversations}),
  setConversationsError: conversationsError => set({conversationsError}),

  setMessages: (conversationId, messages, hasMoreOlder) =>
    set(state => ({
      messagesByConversation: {...state.messagesByConversation, [conversationId]: messages},
      hasMoreOlderMessages: {...state.hasMoreOlderMessages, [conversationId]: hasMoreOlder},
    })),

  prependOlderMessages: (conversationId, messages, hasMoreOlder) =>
    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...messages, ...(state.messagesByConversation[conversationId] ?? [])],
      },
      hasMoreOlderMessages: {...state.hasMoreOlderMessages, [conversationId]: hasMoreOlder},
    })),

  appendMessage: (conversationId, message) => {
    const existing = get().messagesByConversation[conversationId] ?? [];
    if (existing.some(m => m.id === message.id)) return; // dedupe by id
    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...existing, message],
      },
    }));
  },

  replaceMessage: (conversationId, tempId, message) =>
    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] ?? []).map(m =>
          m.id === tempId ? message : m,
        ),
      },
    })),

  removeMessage: (conversationId, id) =>
    set(state => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: (state.messagesByConversation[conversationId] ?? []).filter(
          m => m.id !== id,
        ),
      },
    })),

  reset: () =>
    set({
      conversations: [],
      conversationsPage: 1,
      conversationsTotal: 0,
      isLoadingConversations: false,
      conversationsError: null,
      messagesByConversation: {},
      hasMoreOlderMessages: {},
    }),
}));
