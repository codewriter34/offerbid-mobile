import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '@app/navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingListingId: string | null = null;
let lastOpenedId = '';
let lastOpenedAt = 0;

export function openListingFromPush(listingId: string) {
  const now = Date.now();
  if (listingId === lastOpenedId && now - lastOpenedAt < 1500) return;
  lastOpenedId = listingId;
  lastOpenedAt = now;
  pendingListingId = listingId;
  consumePendingPushListing();
}

export function consumePendingPushListing() {
  if (!pendingListingId || !navigationRef.isReady()) return;
  const names = navigationRef.getRootState()?.routeNames ?? [];
  if (!names.includes('ListingDetail')) return;
  const listingId = pendingListingId;
  pendingListingId = null;
  navigationRef.navigate('ListingDetail', {listingId});
}
