import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps, NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  Auth: undefined;
  HubSelect: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ListingDetail: {listingId: string};
  CreateListing: undefined;
  SubmitBid: {listingId: string; listingTitle: string; minBid: number; startingPrice: number};
  CounterBid: {bidId: string; currentAmount: number; listingTitle: string};
};

export type MainTabParamList = {
  Feed: undefined;
  MyBids: undefined;
  BidDashboard: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
