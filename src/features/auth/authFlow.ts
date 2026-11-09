import {Alert} from 'react-native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '@app/navigation/types';
import {dismissScreen} from '@app/navigation/navigationRef';
import {GoogleSignInStatusCodes} from '@features/auth/authService';

type RootNav = NativeStackNavigationProp<RootStackParamList>;

export function finishAuth(
  navigation: {getParent?: () => RootNav | undefined} & Pick<
    RootNav,
    'replace' | 'goBack' | 'canGoBack' | 'navigate'
  >,
  user: {profileComplete: boolean},
) {
  const root = navigation.getParent?.() ?? navigation;
  if (!user.profileComplete) {
    root.replace('HubSelect');
    return;
  }
  dismissScreen(root);
}

export function showApiError(title: string, error: any) {
  Alert.alert(
    title,
    error?.response?.data?.message ?? error?.message ?? 'Try again.',
  );
}

export function showGoogleError(error: any) {
  if (error?.code === GoogleSignInStatusCodes.SIGN_IN_CANCELLED) return;
  if (error?.code === GoogleSignInStatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
    Alert.alert(
      'Google Play Services Required',
      'Please update Google Play Services to sign in.',
    );
    return;
  }
  const apiCode = error?.response?.data?.code;
  const apiMessage = error?.response?.data?.message;
  if (apiCode === 'FIREBASE_NOT_CONFIGURED') {
    Alert.alert(
      'Google Sign-In unavailable',
      apiMessage ?? 'Google Sign-In is not configured on this server.',
    );
    return;
  }
  Alert.alert(
    'Sign In Failed',
    apiMessage ?? error?.message ?? 'Google sign-in failed. Try again or use email.',
  );
}
