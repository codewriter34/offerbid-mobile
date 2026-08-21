import React from 'react';
import {View, Text, TextInput} from 'react-native';
import {currencyLabel} from '@shared/lib/formatters';

export function AmountInput({
  value,
  onChangeText,
  error,
  placeholder = '0',
  autoFocus,
  onFocus,
  currency = 'XAF',
}: {
  value: string;
  onChangeText: (text: string) => void;
  error?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  currency?: string;
}) {
  return (
    <View
      className={`flex-row items-center rounded-xl border-2 bg-white px-4 ${
        error ? 'border-brand-danger' : 'border-slate-200'
      }`}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        keyboardType="numeric"
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        autoFocus={autoFocus}
        className="flex-1 text-[28px] font-bold text-brand-black"
        style={{
          height: 58,
          lineHeight: 34,
          paddingVertical: 0,
          includeFontPadding: false,
          textAlignVertical: 'center',
        }}
      />
      <Text className="ml-2 text-sm font-semibold text-brand-gray">
        {currencyLabel(currency)}
      </Text>
    </View>
  );
}
