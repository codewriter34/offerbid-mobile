import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {consumePendingPushListing, navigationRef} from '@app/navigation/navigationRef';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from '@app/navigation/types';
import {useAuthStore} from '@features/auth/authStore';
import {useOnboardingStore} from '@features/onboarding/onboardingStore';
import {OnboardingScreen} from '@features/onboarding/screens/OnboardingScreen';
import {IdentityScreen} from '@features/identity/screens/IdentityScreen';
import {NotificationCenterScreen} from '@features/notifications/screens/NotificationCenterScreen';
import {AuthScreen} from '@features/auth/screens/AuthScreen';
import {HubSelectScreen} from '@features/auth/screens/HubSelectScreen';
import {MainTabNavigator} from './MainTabNavigator';
import {ListingDetailScreen} from '@features/listings/screens/ListingDetailScreen';
import {CreateListingScreen} from '@features/listings/screens/CreateListingScreen';
import {SubmitBidScreen} from '@features/bids/screens/SubmitBidScreen';
import {CounterBidScreen} from '@features/bids/screens/CounterBidScreen';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';

const Stack = createNativeStackNavigator<RootStackParamList>();

const modalScreenOptions = {
  presentation: 'modal' as const,
  animation: 'slide_from_bottom' as const,
};

export const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading, user} = useAuthStore();
  const hasCompletedOnboarding = useOnboardingStore(s => s.hasCompletedOnboarding);
  const onboardingHydrated = useOnboardingStore(s => s.isHydrated);
  const hydrateOnboarding = useOnboardingStore(s => s.hydrate);

  useEffect(() => {
    void hydrateOnboarding();
  }, [hydrateOnboarding]);

  useEffect(() => {
    const id = setTimeout(() => {
      if (useAuthStore.getState().isLoading) {
        useAuthStore.getState().setLoading(false);
      }
      if (!useOnboardingStore.getState().isHydrated) {
        useOnboardingStore.setState({isHydrated: true});
      }
    }, 6000);
    return () => clearTimeout(id);
  }, []);

  if (isLoading || !onboardingHydrated) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!hasCompletedOnboarding) {
    return (
      <NavigationContainer
        ref={navigationRef}
        onReady={consumePendingPushListing}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  const needsHub = isAuthenticated && !user?.profileComplete;

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={consumePendingPushListing}>
      <Stack.Navigator
        screenOptions={{headerShown: false}}
        initialRouteName={needsHub ? 'HubSelect' : 'MainTabs'}>
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />
        <Stack.Screen name="ListingDetail" component={ListingDetailScreen} />
        <Stack.Screen
          name="CreateListing"
          component={CreateListingScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="SubmitBid"
          component={SubmitBidScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="CounterBid"
          component={CounterBidScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen name="HubSelect" component={HubSelectScreen} />
        <Stack.Screen
          name="Identity"
          component={IdentityScreen}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationCenterScreen}
          options={{
            presentation: 'transparentModal',
            animation: 'none',
            contentStyle: {backgroundColor: 'transparent'},
          }}
        />
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={modalScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
