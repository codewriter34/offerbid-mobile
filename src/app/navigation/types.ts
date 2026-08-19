import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import {CompositeScreenProps, NavigatorScreenParams} from '@react-navigation/native';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList> | undefined;
  HubSelect: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ListingDetail: {listingId: string};
  CreateListing: undefined;
  SubmitBid: {
    listingId: string;
    listingTitle: string;
    minBid: number;
    startingPrice: number;
    bidId?: string;
    currentAmount?: number;
    recounter?: boolean;
    sellerCounterAmount?: number;
  };
  CounterBid: {bidId: string; currentAmount: number; listingTitle: string};
  Identity: undefined;
  Notifications: undefined;
};

export type MainTabParamList = {
  Explore: undefined;
  MyBids: undefined;
  Selling: undefined;
  Profile: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<AuthStackParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    NativeStackScreenProps<RootStackParamList>
  >;
