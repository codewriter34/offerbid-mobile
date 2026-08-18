module.exports = {
  expo: {
    name: 'OfferBid',
    slug: 'offerbid',
    owner: 'tamehchana',
    version: '0.2.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    scheme: 'offerbid',
    icon: './assets/icon.png',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0052FF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.offerbid.app',
      googleServicesFile: './GoogleService-Info.plist',
      icon: './assets/store/appstore-icon-1024.png',
      infoPlist: {
        UIBackgroundModes: ['remote-notification'],
      },
    },
    android: {
      softwareKeyboardLayoutMode: 'resize',
      package: 'com.offerbid.app',
      googleServicesFile: './google-services.json',
      icon: './assets/icon.png',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#0052FF',
        monochromeImage: './assets/android-icon-monochrome.png',
      },
    },
    web: {
      bundler: 'metro',
      favicon: './assets/favicon.png',
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          backgroundColor: '#0052FF',
          image: './assets/splash-icon.png',
          imageWidth: 200,
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#0052FF',
        },
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/messaging',
      'expo-secure-store',
      'expo-web-browser',
      'expo-asset',
      'expo-font',
    ],
    extra: {
      apiBaseUrl:
        process.env.API_BASE_URL ??
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        'https://offerbid-api.onrender.com/api/v1',
      socketUrl:
        process.env.SOCKET_URL ??
        process.env.EXPO_PUBLIC_SOCKET_URL ??
        'wss://offerbid-api.onrender.com/realtime',
      uploadProvider:
        process.env.UPLOAD_PROVIDER ??
        process.env.EXPO_PUBLIC_UPLOAD_PROVIDER ??
        's3',
      googleWebClientId:
        process.env.GOOGLE_WEB_CLIENT_ID ??
        process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
        '',
      firebaseApiKey:
        process.env.FIREBASE_API_KEY ??
        process.env.EXPO_PUBLIC_FIREBASE_API_KEY ??
        'AIzaSyBarGoOPnoMV490gxz9n1U0ImvszgJWWzM',
      firebaseProjectId: 'offerbid-59cd9',
      firebaseAppId: '1:888122949576:android:7c3139c59898c11a730afd',
      firebaseMessagingSenderId: '888122949576',
      firebaseStorageBucket: 'offerbid-59cd9.firebasestorage.app',
      cloudinaryCloudName:
        process.env.CLOUDINARY_CLOUD_NAME ??
        process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ??
        '',
      cloudinaryUploadPreset:
        process.env.CLOUDINARY_UPLOAD_PRESET ??
        process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
        '',
      eas: {
        projectId: 'de6f6f5b-bc72-4197-86e4-9158bba3bc70',
      },
    },
  },
};
