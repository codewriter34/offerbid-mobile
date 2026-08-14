import React, {useEffect} from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {RootNavigator} from './src/navigation/RootNavigator';
import {useAuth} from './src/hooks/useAuth';
import {setupBackgroundHandler} from './src/services/notifeeService';
import {configureCloudinary} from './src/services/cloudinaryUpload';
import {CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET} from './src/config/env';
import {colors} from './src/theme/colors';

setupBackgroundHandler();

const AppContent: React.FC = () => {
  useAuth();

  useEffect(() => {
    if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET) {
      configureCloudinary(CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET);
    }
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
