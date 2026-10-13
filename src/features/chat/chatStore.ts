import {create} from 'zustand';
import {Conversation, ChatMessage} from './chatTypes';

interface ChatState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  unreadTotal: number;
  keysUploaded: boolean;

  setConversations: (convs: Conversation[]) => void;
  upsertConversation: (conv: Conversation) => void;
  setMessages: (conversationId: string, msgs: ChatMessage[]) => void;
  prependMessages: (conversationId: string, msgs: ChatMessage[]) => void;
  appendMessage: (msg: ChatMessage) => void;
  updateMessage: (conversationId: string, id: string, patch: Partial<ChatMessage>) => void;
  markConversationRead: (conversationId: string) => void;
  setKeysUploaded: (v: boolean) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  messages: {},
  unreadTotal: 0,
  keysUploaded: false,

  setConversations: convs => {
    const unreadTotal = convs.reduce((sum, c) => sum + c.unreadCount, 0);
    set({conversations: convs, unreadTotal});
  },

  upsertConversation: conv => {
    set(state => {
      const existing = state.conversations.findIndex(c => c.id === conv.id);
      let conversations: Conversation[];
      if (existing >= 0) {
        conversations = [...state.conversations];
        conversations[existing] = conv;
      } else {
        conversations = [conv, ...state.conversations];
      }
      const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return {conversations, unreadTotal};
    });
  },

  setMessages: (conversationId, msgs) => {
    set(state => ({messages: {...state.messages, [conversationId]: msgs}}));
  },

  prependMessages: (conversationId, msgs) => {
    set(state => {
      const existing = state.messages[conversationId] ?? [];
      const ids = new Set(existing.map(m => m.id));
      const fresh = msgs.filter(m => !ids.has(m.id));
      return {messages: {...state.messages, [conversationId]: [...fresh, ...existing]}};
    });
  },

  appendMessage: msg => {
    set(state => {
      const existing = state.messages[msg.conversationId] ?? [];
      if (existing.some(m => m.id === msg.id)) return state;
      return {
        messages: {
          ...state.messages,
          [msg.conversationId]: [...existing, msg],
        },
      };
    });
  },

  updateMessage: (conversationId, id, patch) => {
    set(state => {
      const msgs = state.messages[conversationId];
      if (!msgs) return state;
      return {
        messages: {
          ...state.messages,
          [conversationId]: msgs.map(m => (m.id === id ? {...m, ...patch} : m)),
        },
      };
    });
  },

  markConversationRead: conversationId => {
    set(state => {
      const conversations = state.conversations.map(c =>
        c.id === conversationId ? {...c, unreadCount: 0} : c,
      );
      const unreadTotal = conversations.reduce((sum, c) => sum + c.unreadCount, 0);
      return {conversations, unreadTotal};
    });
  },

  setKeysUploaded: v => set({keysUploaded: v}),
}));
