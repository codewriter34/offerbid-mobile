import React, {useState} from 'react';
import {View, Text, StyleSheet, Alert, StatusBar, Linking, TouchableOpacity} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {useAuth} from '../../hooks/useAuth';
import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';
import {GoogleSignInStatusCodes} from '../../services/authService';

type Props = RootStackScreenProps<'Auth'>;

export const AuthScreen: React.FC<Props> = ({navigation}) => {
  const {signIn} = useAuth();
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const openLegal = async (path: 'terms' | 'privacy') => {
    const url = `https://offerbid.co/${path}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Unable to open', url);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!agreedToTerms) {
      Alert.alert(
        'Terms required',
        'Please agree to the Terms of Service and Privacy Policy to continue.',
      );
      return;
    }
    setLoading(true);
    try {
      const user = await signIn();
      if (!user.hub_id) {
        navigation.replace('HubSelect');
      } else {
        navigation.replace('MainTabs');
      }
    } catch (error: any) {
      if (error?.code === GoogleSignInStatusCodes.SIGN_IN_CANCELLED) {
        return;
      }
      if (error?.code === GoogleSignInStatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Required',
          'Please update Google Play Services to sign in.',
        );
        return;
      }
      Alert.alert(
        'Sign In Failed',
        error?.message ?? 'Something went wrong. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />

      <View style={styles.heroSection}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>OB</Text>
        </View>
        <Text style={styles.appName}>OfferBid</Text>
        <Text style={styles.tagline}>
          Buy & sell locally.{'\n'}Bid, agree, meet.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <Text style={styles.welcomeTitle}>Get started</Text>
        <Text style={styles.welcomeSubtitle}>
          Sign in with your Google account to start buying and selling in your neighborhood.
        </Text>

        <Button
          title="Continue with Google"
          onPress={handleGoogleSignIn}
          variant="primary"
          size="lg"
          loading={loading}
          disabled={!agreedToTerms}
          fullWidth
          style={styles.googleButton}
        />

        <View style={styles.termsRow}>
          <TouchableOpacity
            onPress={() => setAgreedToTerms(value => !value)}
            accessibilityRole="checkbox"
            accessibilityState={{checked: agreedToTerms}}
            hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
              {agreedToTerms ? <Text style={styles.checkmark}>✓</Text> : null}
            </View>
          </TouchableOpacity>
          <Text style={styles.terms}>
            I agree to the{' '}
            <Text style={styles.termsLink} onPress={() => openLegal('terms')}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={styles.termsLink} onPress={() => openLegal('privacy')}>
              Privacy Policy
            </Text>
            .
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gradientStart,
  },
  heroSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    elevation: 8,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.gradientStart,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  welcomeTitle: {
    ...typography.h2,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  googleButton: {
    marginBottom: spacing.lg,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.gradientStart,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.gradientStart,
  },
  checkmark: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  terms: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
    lineHeight: 18,
  },
  termsLink: {
    color: colors.gradientStart,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
