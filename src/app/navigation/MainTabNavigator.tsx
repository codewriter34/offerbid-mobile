import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '@app/navigation/types';
import {FeedScreen} from '@features/listings/screens/FeedScreen';
import {MyBidsScreen} from '@features/bids/screens/MyBidsScreen';
import {BidDashboardScreen} from '@features/bids/screens/BidDashboardScreen';
import {ProfileScreen} from '@features/profile/screens/ProfileScreen';
import {BottomNavBar} from '@shared/ui/BottomNavBar';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <BottomNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Explore" component={FeedScreen} />
      <Tab.Screen name="MyBids" component={MyBidsScreen} options={{title: 'My Offers'}} />
      <Tab.Screen name="Selling" component={BidDashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
