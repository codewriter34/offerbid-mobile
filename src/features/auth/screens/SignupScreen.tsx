import React, {useMemo, useState} from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import {AuthStackScreenProps} from '@app/navigation/types';
import {useAuth} from '@features/auth/useAuth';
import {finishAuth, showApiError, showGoogleError} from '@features/auth/authFlow';
import {COUNTRY_OPTIONS} from '@shared/config/hubs';
import {Country, PrimaryIntent} from '@shared/types';
import {
  emailTypingHint,
  isStrongPassword,
  isValidLocalPhone,
  phoneTypingHint,
} from '@shared/lib/validators';
import {
  AuthButton,
  AuthCheckbox,
  AuthField,
  AuthFooterLink,
  AuthHeading,
  AuthShell,
  CountrySheet,
  GoogleButton,
  PasswordRules,
  PasswordToggle,
  WhatsAppField,
} from './AuthUI';

type Props = AuthStackScreenProps<'Signup'>;
type Step = 'form' | 'otp';

export const SignupScreen: React.FC<Props> = ({navigation}) => {
  const {signIn, register, confirmOtp, sendOtp} = useAuth();

  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState<Country>('CAMEROON');
  const [primaryIntent, setPrimaryIntent] = useState<PrimaryIntent>('BUY');
  const [code, setCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);

  const countryCode =
    COUNTRY_OPTIONS.find(c => c.country === country)?.countryCode ?? '+237';
  const emailError = useMemo(() => emailTypingHint(email), [email]);
  const phoneError = useMemo(() => phoneTypingHint(phone, country), [phone, country]);

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

  const handleRegister = async () => {
    if (fullName.trim().length < 2) return;
    if (emailError || !email.trim()) return;
    if (!isStrongPassword(password)) return;
    if (phoneError || !isValidLocalPhone(phone, country)) return;
    if (!agreed) {
      Alert.alert('Terms', 'Please agree to the terms and conditions.');
      return;
    }
    setLoading(true);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        countryCode,
        phone: phone.replace(/\D/g, ''),
        country,
        primaryIntent,
      });
      setStep('otp');
      Alert.alert('Check your email', 'We sent a 6-digit verification code.');
    } catch (error) {
      showApiError('Registration failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!/^\d{6}$/.test(code)) return;
    setLoading(true);
    try {
      finishAuth(
        navigation,
        await confirmOtp({
          email: email.trim(),
          code,
          purpose: 'EMAIL_VERIFY',
        }),
      );
    } catch (error) {
      showApiError('Verification failed', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      await sendOtp(email.trim(), 'EMAIL_VERIFY');
      Alert.alert('Code sent', 'Check your email for a new code.');
    } catch (error) {
      showApiError('Could not resend', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      canClose={navigation.getParent()?.canGoBack() ?? navigation.canGoBack()}
      onClose={() => navigation.getParent()?.goBack() ?? navigation.goBack()}>
      <AuthHeading
        title={step === 'form' ? 'Create account' : 'Check your email'}
        subtitle={
          step === 'form'
            ? 'Buy and sell pre-owned in Cameroon. Find great second-hand products or give your unused items a new home.'
            : `Enter the 6-digit code we sent to ${email || 'you'}.`
        }
      />

      {step === 'form' ? (
        <>
          <GoogleButton label="Sign up with Google" loading={loading} onPress={handleGoogle} />
          <AuthField
            label="Full name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
            error={
              fullName.length > 0 && fullName.trim().length < 2 ? 'invalid' : null
            }
            valid={fullName.trim().length >= 2}
          />
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
          <WhatsAppField
            country={country}
            countryCode={countryCode}
            phone={phone}
            error={phoneError}
            onChangePhone={setPhone}
            onOpenCountry={() => setCountryOpen(true)}
          />
          <AuthField
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter number, letters, symbol"
            secureTextEntry={!showPassword}
            footer={<PasswordRules password={password} />}
            valid={isStrongPassword(password)}
            right={
              <PasswordToggle
                visible={showPassword}
                onToggle={() => setShowPassword(v => !v)}
              />
            }
          />
          <View className="mb-4">
            <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-gray">
              What are you here for first?
            </Text>
            <View className="flex-row gap-2">
              {(
                [
                  ['BUY', 'Buy items'],
                  ['SELL', 'Sell items'],
                  ['BOTH', 'Both'],
                ] as const
              ).map(([value, label]) => {
                const active = primaryIntent === value;
                return (
                  <TouchableOpacity
                    key={value}
                    onPress={() => setPrimaryIntent(value)}
                    className={`flex-1 rounded-xl border px-3 py-3 ${
                      active
                        ? 'border-brand-blue bg-[#EAF4FB]'
                        : 'border-slate-200 bg-white'
                    }`}>
                    <Text
                      className={`text-center text-[13px] font-semibold ${
                        active ? 'text-brand-blue' : 'text-brand-charcoal'
                      }`}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <View className="mb-5 mt-1">
            <AuthCheckbox
              checked={agreed}
              label="I agree to the terms and conditions"
              onToggle={() => setAgreed(v => !v)}
            />
          </View>
          <AuthButton title="Create account" loading={loading} onPress={handleRegister} />
          <AuthFooterLink
            prompt="Already have an account?"
            action="Sign in"
            onPress={() => navigation.navigate('Login')}
          />
          <CountrySheet
            visible={countryOpen}
            country={country}
            onClose={() => setCountryOpen(false)}
            onSelect={next => {
              if (next !== country) setPhone('');
              setCountry(next);
              setCountryOpen(false);
            }}
          />
        </>
      ) : (
        <>
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
          <AuthButton title="Verify code" loading={loading} onPress={handleVerifyOtp} />
          <TouchableOpacity onPress={handleResend} className="mt-4 items-center">
            <Text className="text-sm font-semibold text-brand-blue">Resend code</Text>
          </TouchableOpacity>
          <AuthFooterLink action="Back to sign in" onPress={() => navigation.navigate('Login')} />
        </>
      )}
    </AuthShell>
  );
};
