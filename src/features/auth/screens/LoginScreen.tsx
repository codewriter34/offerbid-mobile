import React, {useMemo, useState} from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import {AuthStackScreenProps} from '@app/navigation/types';
import {useAuth} from '@features/auth/useAuth';
import {finishAuth, showApiError, showGoogleError} from '@features/auth/authFlow';
import {dismissScreen} from '@app/navigation/navigationRef';
import {emailTypingHint, isStrongPassword} from '@shared/lib/validators';
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthHeading,
  AuthShell,
  GoogleButton,
  PasswordRules,
  PasswordToggle,
} from './AuthUI';

type Props = AuthStackScreenProps<'Login'>;
type Step = 'login' | 'forgot' | 'reset';

export const LoginScreen: React.FC<Props> = ({navigation}) => {
  const {
    signIn,
    login,
    sendOtp,
    requestPasswordReset,
    confirmPasswordReset,
  } = useAuth();

  const [step, setStep] = useState<Step>('login');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const emailError = useMemo(() => emailTypingHint(email), [email]);
  const heading =
    step === 'login'
      ? {title: 'Welcome back', sub: 'Sign in to buy and sell second-hand finds near you.'}
      : step === 'forgot'
        ? {title: 'Forgot password', sub: 'We’ll email you a reset code.'}
        : {title: 'Set a new password', sub: 'Use the code from your email, then choose a new password.'};

  const handleGoogle = async () => {
    setLoading(true);
    try {
      finishAuth(navigation, await signIn());
    } catch (error) {
      showGoogleError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (emailError || !email.trim() || !password) return;
    setLoading(true);
    try {
      finishAuth(navigation, await login({email: email.trim(), password}));
    } catch (error) {
      showApiError('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async () => {
    if (emailError || !email.trim()) return;
    setLoading(true);
    try {
      await requestPasswordReset(email.trim());
      setStep('reset');
      Alert.alert('Check your email', 'If that account exists, a reset code was sent.');
    } catch (error) {
      showApiError('Request failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!/^\d{6}$/.test(code) || !isStrongPassword(password)) return;
    setLoading(true);
    try {
      finishAuth(
        navigation,
        await confirmPasswordReset({email: email.trim(), code, password}),
      );
    } catch (error) {
      showApiError('Reset failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendOtp(email.trim(), 'PASSWORD_RESET');
      Alert.alert('Code sent', 'Check your email for a new code.');
    } catch (error) {
      showApiError('Could not resend', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      centered={step === 'forgot'}
      canClose={navigation.getParent()?.canGoBack() ?? navigation.canGoBack()}
      onClose={() => dismissScreen(navigation)}>
      <AuthHeading title={heading.title} subtitle={heading.sub} centered={step === 'forgot'} />

      {step === 'login' ? (
        <GoogleButton label="Continue with Google" loading={loading} onPress={handleGoogle} />
      ) : null}

      {(step === 'login' || step === 'forgot') && (
        <AuthField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          placeholder="name@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          error={emailError}
          valid={!emailError && email.trim().length > 0}
        />
      )}

      {(step === 'login' || step === 'reset') && (
        <AuthField
          label={step === 'reset' ? 'New password' : 'Password'}
          value={password}
          onChangeText={setPassword}
          placeholder={step === 'reset' ? 'Enter number, letters, symbol' : 'Your password'}
          secureTextEntry={!showPassword}
          footer={step === 'reset' ? <PasswordRules password={password} /> : null}
          valid={step === 'reset' ? isStrongPassword(password) : undefined}
          right={
            <PasswordToggle
              visible={showPassword}
              onToggle={() => setShowPassword(v => !v)}
            />
          }
        />
      )}

      {step === 'reset' ? (
        <AuthField
          label="6-digit code"
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          error={code.length > 0 && !/^\d{6}$/.test(code) ? 'invalid' : null}
          valid={/^\d{6}$/.test(code)}
        />
      ) : null}

      {step === 'login' ? (
        <View className="mb-5 mt-1 items-end">
          <TouchableOpacity onPress={() => setStep('forgot')}>
            <Text className="text-sm font-bold text-brand-blue">Forgot password?</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {step === 'forgot' ? <View className="h-5" /> : null}

      <AuthButton
        loading={loading}
        title={
          step === 'login'
            ? 'Sign in'
            : step === 'forgot'
              ? 'Send reset code'
              : 'Save new password'
        }
        onPress={
          step === 'login' ? handleLogin : step === 'forgot' ? handleForgot : handleReset
        }
      />

      {step === 'reset' ? (
        <TouchableOpacity onPress={handleResend} className="mt-4 items-center">
          <Text className="text-sm font-semibold text-brand-blue">Resend code</Text>
        </TouchableOpacity>
      ) : null}

      {step === 'login' ? (
        <AuthFooterLink
          prompt="Don’t have an account?"
          action="Create account"
          onPress={() => navigation.navigate('Signup')}
        />
      ) : (
        <AuthFooterLink action="Back to sign in" onPress={() => setStep('login')} />
      )}
    </AuthShell>
  );
};
