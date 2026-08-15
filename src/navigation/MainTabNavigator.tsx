import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '../types/navigation';
import {FeedScreen} from '../screens/Feed/FeedScreen';
import {MyBidsScreen} from '../screens/MyBids/MyBidsScreen';
import {BidDashboardScreen} from '../screens/BidDashboard/BidDashboardScreen';
import {NotificationCenterScreen} from '../screens/NotificationCenter/NotificationCenterScreen';
import {ProfileScreen} from '../screens/Profile/ProfileScreen';
import {useNotificationStore} from '../store/notificationStore';
import {colors} from '../theme/colors';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Feed: '🏠',
    'My Bids': '💰',
    Dashboard: '📋',
    Alerts: '🔔',
    Profile: '👤',
  };
  return (
    <Text style={{fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.6}}>
      {icons[label] ?? '•'}
    </Text>
  );
}

export const MainTabNavigator: React.FC = () => {
  const unreadCount = useNotificationStore(s => s.unreadCount);

  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text.light,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarIcon: ({focused}) => {
          const labels: Record<string, string> = {
            Feed: 'Feed',
            MyBids: 'My Bids',
            BidDashboard: 'Dashboard',
            Notifications: 'Alerts',
            Profile: 'Profile',
          };
          return <TabIcon label={labels[route.name] ?? ''} focused={focused} />;
        },
      })}>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen
        name="MyBids"
        component={MyBidsScreen}
        options={{title: 'My Bids'}}
      />
      <Tab.Screen
        name="BidDashboard"
        component={BidDashboardScreen}
        options={{title: 'Dashboard'}}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationCenterScreen}
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.error,
            fontSize: 10,
            minWidth: 18,
            height: 18,
            lineHeight: 18,
          },
        }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
