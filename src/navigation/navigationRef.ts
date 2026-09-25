// Navigation-ref singleton for push-driven navigation. This app had no
// existing push -> navigate wiring (onNotificationEvent in notifeeService.ts
// was exported but never subscribed to anywhere), so this establishes the
// pattern from scratch — mirrored here for both listing and chat pushes so
// future push-navigable screens have one place to extend.
import {createNavigationContainerRef} from '@react-navigation/native';
import {RootStackParamList} from '../types/navigation';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

let pendingListingId: string | null = null;
let pendingConversationId: string | null = null;

export function openListingFromPush(listingId: string): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('ListingDetail', {listingId});
  } else {
    pendingListingId = listingId;
  }
}

export function consumePendingPushListing(): string | null {
  const id = pendingListingId;
  pendingListingId = null;
  return id;
}

export function openConversationFromPush(conversationId: string): void {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Thread', {conversationId});
  } else {
    pendingConversationId = conversationId;
  }
}

export function consumePendingPushConversation(): string | null {
  const id = pendingConversationId;
  pendingConversationId = null;
  return id;
}

// Called once the NavigationContainer reports ready, to flush anything that
// arrived (e.g. a cold-start notification tap) before it existed.
export function flushPendingPushNavigation(): void {
  const listingId = consumePendingPushListing();
  if (listingId) {
    navigationRef.navigate('ListingDetail', {listingId});
    return;
  }
  const conversationId = consumePendingPushConversation();
  if (conversationId) {
    navigationRef.navigate('Thread', {conversationId});
  }
}
