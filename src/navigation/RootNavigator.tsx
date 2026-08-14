import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '../types/navigation';
import {AuthScreen} from '../screens/Auth/AuthScreen';
import {HubSelectScreen} from '../screens/HubSelect/HubSelectScreen';
import {MainTabNavigator} from './MainTabNavigator';
import {ListingDetailScreen} from '../screens/ListingDetail/ListingDetailScreen';
import {CreateListingScreen} from '../screens/CreateListing/CreateListingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  // TODO: Check auth state to determine initial route
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{headerShown: false}}>
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="HubSelect" component={HubSelectScreen} />
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
