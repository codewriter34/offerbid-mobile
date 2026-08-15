import {useEffect} from 'react';
import {
  subscribeToEvent,
  subscribeToListing,
  unsubscribeFromListing,
} from '../services/socketClient';
import {useBidStore} from '../store/bidStore';
import {useListingStore} from '../store/listingStore';
import {useNotificationStore} from '../store/notificationStore';
import {mapBid, mapListing, mapNotification} from '../utils/mappers';

export function useRealtimeBids(listingId?: string) {
  const updateBid = useBidStore(s => s.updateBid);
  const addBid = useBidStore(s => s.addBid);
  const updateListing = useListingStore(s => s.updateListing);
  const addNotification = useNotificationStore(s => s.addNotification);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

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
        if (listing.id) updateListing(listing.id, listing);
      }),
    );

    unsubs.push(
      subscribeToEvent('notification:new', (raw: unknown) => {
        addNotification(mapNotification(raw));
      }),
    );

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, []);

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
