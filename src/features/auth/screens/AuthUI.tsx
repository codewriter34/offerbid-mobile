import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  Pressable,
  Keyboard,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Logo} from '@shared/ui/Logo';
import {colors} from '@shared/theme/colors';
import {COUNTRY_OPTIONS} from '@shared/config/hubs';
import {Country} from '@shared/types';
import {getPasswordChecks} from '@shared/lib/validators';

export const COUNTRY_FLAG: Record<Country, string> = {
  CAMEROON: '🇨🇲',
  NIGERIA: '🇳🇬',
};

export function AuthShell({
  children,
  centered,
  canClose,
  onClose,
}: {
  children: React.ReactNode;
  centered?: boolean;
  canClose?: boolean;
  onClose?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior="padding"
      keyboardVerticalOffset={0}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View className="px-6" style={{paddingTop: insets.top + 8}}>
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Logo size={36} />
            <Text className="text-[17px] font-bold text-brand-black">OfferBid</Text>
          </View>
          {canClose ? (
            <TouchableOpacity
              onPress={onClose}
              className="h-9 w-9 items-center justify-center rounded-full bg-red-50"
              accessibilityRole="button"
              accessibilityLabel="Close">
              <CloseX />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: centered ? 'center' : 'flex-start',
          paddingHorizontal: 24,
          paddingBottom: 40 + (keyboardHeight ? 12 : 0),
        }}>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function AuthHeading({
  title,
  subtitle,
  centered,
}: {
  title: string;
  subtitle: string;
  centered?: boolean;
}) {
  return (
    <>
      <Text
        className={`font-bold tracking-tight text-brand-black ${
          centered ? 'text-center text-[28px] leading-8' : 'text-[32px] leading-9'
        }`}>
        {title}
      </Text>
      <Text
        className={`mt-2 text-[15px] leading-6 text-brand-charcoal ${
          centered ? 'text-center' : ''
        }`}>
        {subtitle}
      </Text>
    </>
  );
}

export function AuthField({
  label,
  right,
  error,
  valid,
  footer,
  ...input
}: {
  label: string;
  right?: React.ReactNode;
  error?: string | null;
  valid?: boolean;
  footer?: React.ReactNode;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-gray">
        {label}
      </Text>
      <View
        className={`flex-row items-center rounded-xl border px-4 ${
          error
            ? 'border-brand-danger bg-[#FEF2F2]'
            : valid
              ? 'border-brand-success bg-[#ECFDF5]'
              : 'border-slate-200 bg-white'
        }`}>
        <TextInput
          className="min-h-[52px] flex-1 text-base text-brand-black"
          placeholderTextColor={colors.text.light}
          {...input}
        />
        {error ? <StatusMark ok={false} /> : valid ? <StatusMark ok /> : null}
        {right}
      </View>
      {footer}
    </View>
  );
}

export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={8}>
      <Text className="text-xs font-semibold text-brand-blue">
        {visible ? 'Hide' : 'Show'}
      </Text>
    </TouchableOpacity>
  );
}

export function PasswordRules({password}: {password: string}) {
  const checks = getPasswordChecks(password);
  const icons: Record<string, string> = {
    length: '8+',
    number: '1',
    lower: 'a',
    upper: 'A',
    symbol: '#',
  };

  return (
    <View className="mt-2.5">
      <View className="mb-2 flex-row gap-1.5">
        {checks.map(check => (
          <View
            key={check.id}
            className={`h-1.5 flex-1 rounded-full ${
              check.met ? 'bg-brand-success' : 'bg-slate-200'
            }`}
          />
        ))}
      </View>
      <View className="flex-row justify-between">
        {checks.map(check => (
          <View
            key={check.id}
            className={`h-9 w-9 items-center justify-center rounded-full ${
              check.met ? 'bg-brand-success' : 'bg-slate-100'
            }`}
            accessibilityLabel={check.label}
            accessibilityState={{checked: check.met}}>
            <Text
              className={`text-[12px] font-bold ${
                check.met ? 'text-white' : 'text-brand-gray'
              }`}>
              {icons[check.id]}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function GoogleButton({
  label,
  loading,
  onPress,
}: {
  label: string;
  loading: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.85}
        className="mt-7 flex-row items-center justify-center gap-3 rounded-xl border border-[#DADCE0] bg-white py-3.5 shadow-sm">
        {loading ? (
          <ActivityIndicator size="small" color={colors.brand.blue} />
        ) : (
          <>
            <GoogleMark />
            <Text className="text-[15px] font-semibold text-brand-black">{label}</Text>
          </>
        )}
      </TouchableOpacity>
      <View className="my-6 flex-row items-center gap-3">
        <View className="h-px flex-1 bg-slate-200" />
        <Text className="text-xs font-medium uppercase tracking-widest text-brand-gray">
          or
        </Text>
        <View className="h-px flex-1 bg-slate-200" />
      </View>
    </>
  );
}

export function AuthButton({
  title,
  onPress,
  loading,
}: {
  title: string;
  onPress: () => void;
  loading: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.85}
      className="min-h-[52px] items-center justify-center rounded-xl bg-brand-blue">
      {loading ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text className="text-[16px] font-bold text-white">{title}</Text>
      )}
    </TouchableOpacity>
  );
}

export function AuthCheckbox({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-start gap-2.5"
      accessibilityRole="checkbox"
      accessibilityState={{checked}}>
      <View
        className={`mt-0.5 h-5 w-5 items-center justify-center rounded ${
          checked ? 'bg-brand-blue' : 'border border-slate-300 bg-white'
        }`}>
        {checked ? <Text className="text-[11px] font-bold text-white">✓</Text> : null}
      </View>
      <Text className="flex-1 text-sm leading-5 text-brand-charcoal">{label}</Text>
    </TouchableOpacity>
  );
}

export function AuthFooterLink({
  prompt,
  action,
  onPress,
}: {
  prompt?: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View className="mt-6 items-center">
      {prompt ? (
        <Text className="text-sm text-brand-charcoal">
          {prompt}{' '}
          <Text className="font-bold text-brand-blue" onPress={onPress}>
            {action}
          </Text>
        </Text>
      ) : (
        <Text className="text-sm font-bold text-brand-blue" onPress={onPress}>
          {action}
        </Text>
      )}
    </View>
  );
}

export function WhatsAppField({
  country,
  countryCode,
  phone,
  error,
  onChangePhone,
  onOpenCountry,
}: {
  country: Country;
  countryCode: string;
  phone: string;
  error: string | null;
  onChangePhone: (value: string) => void;
  onOpenCountry: () => void;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand-gray">
        WhatsApp number
      </Text>
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onOpenCountry}
          className="h-[52px] w-[118px] flex-row items-center justify-between rounded-xl border border-slate-200 px-2.5">
          <Text className="text-base">
            {COUNTRY_FLAG[country]} {countryCode}
          </Text>
          <Text className="text-brand-gray">▾</Text>
        </TouchableOpacity>
        <View
          className={`min-h-[52px] flex-1 flex-row items-center rounded-xl border px-3 ${
            error && !error.includes('more digit')
              ? 'border-brand-danger bg-[#FEF2F2]'
              : !error && phone.replace(/\D/g, '').length > 0
                ? 'border-brand-success bg-[#ECFDF5]'
                : 'border-slate-200 bg-white'
          }`}>
          <TextInput
            className="min-h-[52px] flex-1 text-base text-brand-black"
            value={phone}
            onChangeText={onChangePhone}
            placeholder={country === 'CAMEROON' ? '677000000' : '8012345678'}
            placeholderTextColor={colors.text.light}
            keyboardType="phone-pad"
          />
          {error && !error.includes('more digit') ? (
            <StatusMark ok={false} />
          ) : !error && phone.replace(/\D/g, '').length > 0 ? (
            <StatusMark ok />
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function CountrySheet({
  visible,
  country,
  onClose,
  onSelect,
}: {
  visible: boolean;
  country: Country;
  onClose: () => void;
  onSelect: (country: Country) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-3xl bg-white px-5 pb-8 pt-4">
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-slate-200" />
          <Text className="mb-3 text-base font-bold text-brand-black">Country</Text>
          {COUNTRY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.country}
              onPress={() => onSelect(opt.country)}
              className={`mb-2 flex-row items-center justify-between rounded-xl px-4 py-3.5 ${
                country === opt.country ? 'bg-[#EAF4FB]' : 'bg-slate-50'
              }`}>
              <Text className="text-base font-semibold text-brand-black">
                {COUNTRY_FLAG[opt.country]}  {opt.label}
              </Text>
              <Text className="text-sm text-brand-gray">{opt.countryCode}</Text>
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function StatusMark({ok}: {ok: boolean}) {
  return (
    <View
      className={`mr-1 h-5 w-5 items-center justify-center rounded-full ${
        ok ? 'bg-brand-success' : 'bg-brand-danger'
      }`}>
      <Text className="text-[11px] font-bold text-white">{ok ? '✓' : '!'}</Text>
    </View>
  );
}

function CloseX() {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14">
      <Path
        d="M2 2l10 10M12 2L2 12"
        fill="none"
        stroke={colors.brand.danger}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </Svg>
  );
}
