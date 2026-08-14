import {useEffect} from 'react';
import {subscribeToEvent, joinRoom, leaveRoom} from '../services/socketClient';
import {useBidStore} from '../store/bidStore';
import {useListingStore} from '../store/listingStore';
import {useNotificationStore} from '../store/notificationStore';
import {Bid, AppNotification, Listing} from '../types';

export function useRealtimeBids(listingId?: string) {
  const updateBid = useBidStore(s => s.updateBid);
  const addBid = useBidStore(s => s.addBid);
  const updateListing = useListingStore(s => s.updateListing);
  const addNotification = useNotificationStore(s => s.addNotification);

  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      subscribeToEvent<Bid>('bid:new', bid => {
        addBid(bid);
      }),
    );

    unsubs.push(
      subscribeToEvent<Bid>('bid:updated', bid => {
        updateBid(bid.id, bid);
      }),
    );

    unsubs.push(
      subscribeToEvent<Partial<Listing> & {id: string}>(
        'listing:updated',
        listing => {
          updateListing(listing.id, listing);
        },
      ),
    );

    unsubs.push(
      subscribeToEvent<AppNotification>('notification:new', notification => {
        addNotification(notification);
      }),
    );

    return () => {
      unsubs.forEach(fn => fn());
    };
  }, []);

  useEffect(() => {
    if (!listingId) return;
    joinRoom(`listing:${listingId}`);
    return () => {
      leaveRoom(`listing:${listingId}`);
    };
  }, [listingId]);
}

export function useRealtimeUser(userId?: string) {
  useEffect(() => {
    if (!userId) return;
    joinRoom(`user:${userId}`);
    return () => {
      leaveRoom(`user:${userId}`);
    };
  }, [userId]);
}
