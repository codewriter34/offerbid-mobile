import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useAuth} from './src/hooks/useAuth';
import {
  setupBackgroundHandler,
  onNotificationEvent,
  conversationIdFromPushData,
  listingIdFromPushData,
  getInitialPushData,
} from './src/services/notifeeService';
import {
  openConversationFromPush,
  openListingFromPush,
} from './src/navigation/navigationRef';
import {configureCloudinary} from './src/services/cloudinaryUpload';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from './src/config/env';
import {colors} from './src/theme/colors';

setupBackgroundHandler();

function navigateFromPushData(data?: Record<string, string> | null) {
  if (!data) return;
  const conversationId = conversationIdFromPushData(data);
  if (conversationId) {
    openConversationFromPush(conversationId);
    return;
  }
  const listingId = listingIdFromPushData(data);
  if (listingId) {
    openListingFromPush(listingId);
  }
}

const AppContent: React.FC = () => {
  useAuth();

  useEffect(() => {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      configureCloudinary(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
    }
  }, []);

  useEffect(() => {
    // Foreground / background (but not killed) notification taps.
    const unsubscribe = onNotificationEvent((_type, data) => {
      navigateFromPushData(data);
    });

    // Cold start: the app was launched BY tapping a notification.
    getInitialPushData().then(navigateFromPushData);

    return unsubscribe;
  }, []);

  return <RootNavigator />;
};

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={colors.white}
      />
      <AppContent />
    </SafeAreaProvider>
  );
};

export default App;
