import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from '@app/navigation/RootNavigator';
import {openListingFromPush} from '@app/navigation/navigationRef';
import {useAuth} from '@features/auth/useAuth';
import {useAuthStore} from '@features/auth/authStore';
import {useHubStore} from '@features/auth/hubStore';
import {useInboxRealtime} from '@features/notifications/useInboxRealtime';
import {
  getInitialNotificationListingId,
  listingIdFromPushData,
  onNotificationEvent,
} from '@features/notifications/pushService';
import {configureCloudinary} from '@shared/lib/uploads/cloudinary';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from '@shared/config/env';
import {colors} from '@shared/theme/colors';

const AppContent: React.FC = () => {
  useAuth();
  const user = useAuthStore(s => s.user);
  useInboxRealtime(Boolean(user));
  const hydrateHubs = useHubStore(s => s.hydrate);

  useEffect(() => {
    void hydrateHubs();
  }, [hydrateHubs]);

  useEffect(() => {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      configureCloudinary(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
    }
  }, []);

  useEffect(() => {
    const sub = onNotificationEvent((_type, data) => {
      const listingId = listingIdFromPushData(data);
      if (listingId) openListingFromPush(listingId);
    });
    void getInitialNotificationListingId().then(listingId => {
      if (listingId) openListingFromPush(listingId);
    });
    return () => sub.remove();
  }, []);

  return <RootNavigator />;
};

export const Root: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.brand.white} />
      <AppContent />
    </SafeAreaProvider>
  );
};
