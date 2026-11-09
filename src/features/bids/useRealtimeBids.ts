import {useEffect} from 'react';
import {
  getSocket,
  subscribeToEvent,
  subscribeToListing,
  unsubscribeFromListing,
} from '@shared/lib/socket';
import {useBidStore} from '@features/bids/bidStore';
import {useListingStore} from '@features/listings/listingStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {useAuthStore} from '@features/auth/authStore';
import {mapBid, mapListing, mapNotification} from '@api/mappers';

export function useRealtimeBids(listingId?: string) {
  const updateBid = useBidStore(s => s.updateBid);
  const addBid = useBidStore(s => s.addBid);
  const upsertListing = useListingStore(s => s.upsertListing);
  const addNotification = useNotificationStore(s => s.addNotification);
  const userId = useAuthStore(s => s.user?.id);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubs: Array<() => void> = [];

    const attach = () => {
      if (cancelled) return;
      if (!getSocket()) {
        if (!userId) return;
        timer = setTimeout(attach, 400);
        return;
      }

      const onBid = (raw: unknown) => {
        const bid = mapBid(raw);
        addBid(bid);
        updateBid(bid.id, bid);
      };

      unsubs.push(subscribeToEvent('bid:placed', onBid));
      unsubs.push(subscribeToEvent('bid:countered', onBid));
      unsubs.push(subscribeToEvent('bid:responded', onBid));
      unsubs.push(subscribeToEvent('bid:new', onBid));
      unsubs.push(subscribeToEvent('bid:updated', onBid));
      unsubs.push(
        subscribeToEvent('listing:updated', (raw: unknown) => {
          const listing = mapListing(raw);
          if (listing.id) upsertListing(listing);
        }),
      );
      unsubs.push(
        subscribeToEvent('notification:new', (raw: unknown) => {
          addNotification(mapNotification(raw));
        }),
      );
    };

    attach();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubs.forEach(fn => fn());
    };
  }, [addBid, addNotification, updateBid, upsertListing, userId]);

  useEffect(() => {
    if (!listingId) return;
    subscribeToListing(listingId);
    return () => {
      unsubscribeFromListing(listingId);
    };
  }, [listingId]);
}

export function useRealtimeUser(_userId?: string) {
  useRealtimeBids();
}
