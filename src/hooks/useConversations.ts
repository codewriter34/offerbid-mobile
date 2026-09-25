import {useCallback} from 'react';
import {useChatStore} from '../store/chatStore';
import {listConversations, createConversation} from '../services/chatService';

const PAGE_SIZE = 20;

export function useConversations() {
  const store = useChatStore();

  const fetchConversations = useCallback(async (refresh = false) => {
    store.setConversationsLoading(true);
    store.setConversationsError(null);
    try {
      const page = refresh ? 1 : store.conversationsPage;
      const res = await listConversations(page, PAGE_SIZE);
      if (refresh || page === 1) {
        store.setConversations(res.data, res.page, res.total);
      } else {
        store.appendConversations(res.data, res.page, res.total);
      }
    } catch (err: any) {
      store.setConversationsError(
        err.response?.data?.message ?? 'Failed to load conversations',
      );
    } finally {
      store.setConversationsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.conversationsPage]);

  const loadMoreConversations = useCallback(async () => {
    if (store.conversations.length >= store.conversationsTotal) return;
    try {
      const nextPage = store.conversationsPage + 1;
      const res = await listConversations(nextPage, PAGE_SIZE);
      store.appendConversations(res.data, res.page, res.total);
    } catch {
      // best-effort — keep whatever was already loaded
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.conversationsPage, store.conversations.length, store.conversationsTotal]);

  const totalUnread = store.conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  return {
    conversations: store.conversations,
    isLoading: store.isLoadingConversations,
    error: store.conversationsError,
    totalUnread,
    hasMore: store.conversations.length < store.conversationsTotal,
    fetchConversations,
    loadMoreConversations,
  };
}

// Entry point used by "Message seller" on the listing detail screen: creates
// (or fetches, per the endpoint's idempotency) the conversation for a
// listing and returns it so the caller can navigate to the Thread screen.
export function useStartConversation() {
  const upsertConversation = useChatStore(s => s.upsertConversation);

  return useCallback(
    async (listingId: string) => {
      const conversation = await createConversation(listingId);
      upsertConversation(conversation);
      return conversation;
    },
    [upsertConversation],
  );
}
