import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {useAuth} from '../../hooks/useAuth';
import {Button} from '../../components/Button';
import {Logo} from '../../components/Logo';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {GoogleSignInStatusCodes} from '../../services/authService';
import {COUNTRY_OPTIONS} from '../../config/hubs';
import {Country} from '../../types';
import {isValidEmail, isValidPassword} from '../../utils/validators';

type Props = RootStackScreenProps<'Auth'>;
type Mode = 'login' | 'register' | 'otp' | 'forgot' | 'reset';

export const AuthScreen: React.FC<Props> = ({navigation}) => {
  const {
    signIn,
    login,
    register,
    confirmOtp,
    sendOtp,
    requestPasswordReset,
    confirmPasswordReset,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>('CAMEROON');
  const [code, setCode] = useState('');
  const [otpPurpose, setOtpPurpose] = useState<'EMAIL_VERIFY' | 'PASSWORD_RESET'>(
    'EMAIL_VERIFY',
  );

  const countryCode =
    COUNTRY_OPTIONS.find(c => c.country === country)?.countryCode ?? '+237';

  const afterAuth = (user: {profileComplete: boolean}) => {
    if (!user.profileComplete) {
      navigation.replace('HubSelect', undefined);
    } else {
      navigation.replace('MainTabs', {screen: 'Feed'});
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const user = await signIn();
      afterAuth(user);
    } catch (error: any) {
      if (error?.code === GoogleSignInStatusCodes.SIGN_IN_CANCELLED) return;
      if (error?.code === GoogleSignInStatusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services Required',
          'Please update Google Play Services to sign in.',
        );
        return;
      }
      Alert.alert('Sign In Failed', error?.message ?? 'Google sign-in is not available yet.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    const pwdErr = isValidPassword(password);
    if (pwdErr) {
      Alert.alert('Invalid password', pwdErr);
      return;
    }
    setLoading(true);
    try {
      const user = await login({email: email.trim(), password});
      afterAuth(user);
    } catch (error: any) {
      Alert.alert('Login failed', error?.response?.data?.message ?? error?.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (fullName.trim().length < 2) {
      Alert.alert('Name required', 'Enter your full name.');
      return;
    }
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }
    const pwdErr = isValidPassword(password);
    if (pwdErr) {
      Alert.alert('Invalid password', pwdErr);
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      Alert.alert('Invalid phone', 'Enter your WhatsApp number without the country code.');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        countryCode,
        phone: digits,
        country,
      });
      setOtpPurpose('EMAIL_VERIFY');
      setMode('otp');
      Alert.alert('Check your email', 'We sent a 6-digit verification code.');
    } catch (error: any) {
      Alert.alert(
        'Registration failed',
        error?.response?.data?.message ?? error?.message ?? 'Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Invalid code', 'Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const user = await confirmOtp({
        email: email.trim(),
        code,
        purpose: otpPurpose,
      });
      afterAuth(user);
    } catch (error: any) {
      Alert.alert(
        'Verification failed',
        error?.response?.data?.message ?? error?.message ?? 'Try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!isValidEmail(email)) {
      Alert.alert('Invalid email', 'Enter the email on your account.');
      return;
    }
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setOtpPurpose('PASSWORD_RESET');
      setMode('reset');
      Alert.alert('Check your email', 'If that account exists, a reset code was sent.');
    } catch (error: any) {
      Alert.alert('Request failed', error?.response?.data?.message ?? error?.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!/^\d{6}$/.test(code)) {
      Alert.alert('Invalid code', 'Enter the 6-digit reset code.');
      return;
    }
    const pwdErr = isValidPassword(password);
    if (pwdErr) {
      Alert.alert('Invalid password', pwdErr);
      return;
    }
    setLoading(true);
    try {
      const user = await confirmPasswordReset({
        email: email.trim(),
        code,
        password,
      });
      afterAuth(user);
    } catch (error: any) {
      Alert.alert('Reset failed', error?.response?.data?.message ?? error?.message ?? 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendOtp(email.trim(), otpPurpose);
      Alert.alert('Code sent', 'Check your email for a new code.');
    } catch (error: any) {
      Alert.alert('Could not resend', error?.response?.data?.message ?? error?.message ?? 'Wait and try again.');
    } finally {
      setLoading(false);
    }
  };

  const title =
    mode === 'login'
      ? 'Welcome back'
      : mode === 'register'
        ? 'Create account'
        : mode === 'otp'
          ? 'Verify email'
          : mode === 'forgot'
            ? 'Forgot password'
            : 'Reset password';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <StatusBar barStyle="light-content" backgroundColor={colors.gradientStart} />
      <View style={styles.heroSection}>
        <Logo size={88} style={styles.logo} />
        <Text style={styles.appName}>OfferBid</Text>
        <Text style={styles.tagline}>Buy & sell locally.{'\n'}Bid, agree, meet.</Text>
      </View>

      <ScrollView
        style={styles.bottomSection}
        contentContainerStyle={styles.bottomContent}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.welcomeTitle}>{title}</Text>

        {(mode === 'login' || mode === 'register' || mode === 'forgot') && (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.text.light}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        )}

        {mode === 'register' && (
          <>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.text.light}
            />
            <View style={styles.countryRow}>
              {COUNTRY_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.country}
                  style={[
                    styles.countryChip,
                    country === opt.country && styles.countryChipActive,
                  ]}
                  onPress={() => setCountry(opt.country)}>
                  <Text
                    style={[
                      styles.countryChipText,
                      country === opt.country && styles.countryChipTextActive,
                    ]}>
                    {opt.label} {opt.countryCode}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="WhatsApp number (no country code)"
              placeholderTextColor={colors.text.light}
              keyboardType="phone-pad"
            />
          </>
        )}

        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={mode === 'reset' ? 'New password (min 8)' : 'Password (min 8)'}
            placeholderTextColor={colors.text.light}
            secureTextEntry
          />
        )}

        {(mode === 'otp' || mode === 'reset') && (
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="6-digit email code"
            placeholderTextColor={colors.text.light}
            keyboardType="number-pad"
            maxLength={6}
          />
        )}

        {mode === 'login' && (
          <Button title="Log in" onPress={handleLogin} loading={loading} fullWidth size="lg" />
        )}
        {mode === 'register' && (
          <Button title="Create account" onPress={handleRegister} loading={loading} fullWidth size="lg" />
        )}
        {mode === 'otp' && (
          <Button title="Verify code" onPress={handleVerifyOtp} loading={loading} fullWidth size="lg" />
        )}
        {mode === 'forgot' && (
          <Button title="Send reset code" onPress={handleForgot} loading={loading} fullWidth size="lg" />
        )}
        {mode === 'reset' && (
          <Button title="Set new password" onPress={handleReset} loading={loading} fullWidth size="lg" />
        )}

        {(mode === 'otp' || mode === 'reset') && (
          <TouchableOpacity onPress={handleResend} style={styles.linkWrap}>
            <Text style={styles.link}>Resend code</Text>
          </TouchableOpacity>
        )}

        {mode === 'login' && (
          <TouchableOpacity onPress={() => setMode('forgot')} style={styles.linkWrap}>
            <Text style={styles.link}>Forgot password?</Text>
          </TouchableOpacity>
        )}

        {(mode === 'login' || mode === 'register') && (
          <>
            <Text style={styles.or}>or</Text>
            <Button
              title="Continue with Google"
              onPress={handleGoogleSignIn}
              variant="outline"
              size="lg"
              loading={loading}
              fullWidth
            />
          </>
        )}

        <TouchableOpacity
          onPress={() =>
            setMode(mode === 'register' || mode === 'otp' || mode === 'forgot' || mode === 'reset' ? 'login' : 'register')
          }
          style={styles.linkWrap}>
          <Text style={styles.link}>
            {mode === 'login' ? 'Create an account' : 'Back to login'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By continuing you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.gradientStart},
  heroSection: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {marginBottom: spacing.md},
  appName: {fontSize: 28, fontWeight: '800', color: colors.white, marginBottom: spacing.xs},
  tagline: {
    ...typography.bodySmall,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  bottomContent: {padding: spacing.xl, paddingBottom: spacing.xxl},
  welcomeTitle: {...typography.h2, color: colors.text.primary, marginBottom: spacing.lg},
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  countryRow: {flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm},
  countryChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  countryChipActive: {backgroundColor: colors.primary, borderColor: colors.primary},
  countryChipText: {...typography.caption, color: colors.text.secondary},
  countryChipTextActive: {color: colors.black, fontWeight: '700'},
  or: {
    ...typography.caption,
    color: colors.text.light,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  linkWrap: {marginTop: spacing.md, alignItems: 'center'},
  link: {...typography.bodySmall, color: colors.gradientStart, fontWeight: '600'},
  terms: {
    ...typography.caption,
    color: colors.text.light,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
