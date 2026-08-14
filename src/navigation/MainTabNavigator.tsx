import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types/navigation';
import {FeedScreen} from '../screens/Feed/FeedScreen';
import {MyBidsScreen} from '../screens/MyBids/MyBidsScreen';
import {BidDashboardScreen} from '../screens/BidDashboard/BidDashboardScreen';
import {NotificationCenterScreen} from '../screens/NotificationCenter/NotificationCenterScreen';
import {ProfileScreen} from '../screens/Profile/ProfileScreen';
import {colors} from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
      }}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="MyBids" component={MyBidsScreen} options={{title: 'My Bids'}} />
      <Tab.Screen
        name="BidDashboard"
        component={BidDashboardScreen}
        options={{title: 'Dashboard'}}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationCenterScreen}
        options={{title: 'Alerts'}}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
