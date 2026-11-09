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

type DismissableNav = {
  canGoBack: () => boolean;
  goBack: () => void;
  getParent?: () => DismissableNav | undefined;
  navigate: (name: 'MainTabs', params?: {screen: 'Explore'}) => void;
};

export function dismissScreen(navigation: DismissableNav) {
  const parent = navigation.getParent?.();
  if (parent?.canGoBack()) {
    parent.goBack();
    return;
  }
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  if (navigationRef.isReady()) {
    navigationRef.navigate('MainTabs', {screen: 'Explore'});
    return;
  }
  navigation.navigate('MainTabs', {screen: 'Explore'});
}
