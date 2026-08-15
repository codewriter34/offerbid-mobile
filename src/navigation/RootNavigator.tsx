import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import {useAuthStore} from '../store/authStore';
import {AuthScreen} from '../screens/Auth/AuthScreen';
import {HubSelectScreen} from '../screens/HubSelect/HubSelectScreen';
import {MainTabNavigator} from './MainTabNavigator';
import {ListingDetailScreen} from '../screens/ListingDetail/ListingDetailScreen';
import {CreateListingScreen} from '../screens/CreateListing/CreateListingScreen';
import {SubmitBidScreen} from '../screens/SubmitBid/SubmitBidScreen';
import {CounterBidScreen} from '../screens/CounterBid/CounterBidScreen';
import {LoadingSpinner} from '../components/LoadingSpinner';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading, user} = useAuthStore();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  const needsHub = isAuthenticated && !user?.hub_id;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthScreen} />
        ) : needsHub ? (
          <Stack.Screen name="HubSelect" component={HubSelectScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ListingDetail"
              component={ListingDetailScreen}
            />
            <Stack.Screen
              name="CreateListing"
              component={CreateListingScreen}
              options={{presentation: 'modal'}}
            />
            <Stack.Screen
              name="SubmitBid"
              component={SubmitBidScreen}
              options={{presentation: 'modal'}}
            />
            <Stack.Screen
              name="CounterBid"
              component={CounterBidScreen}
              options={{presentation: 'modal'}}
            />
            <Stack.Screen name="HubSelect" component={HubSelectScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
