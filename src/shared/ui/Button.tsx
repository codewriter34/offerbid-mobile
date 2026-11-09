import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing, borderRadius} from '@shared/theme/spacing';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const VARIANT_STYLES: Record<string, {bg: string; text: string; border?: string}> = {
  primary: {bg: colors.brand.blue, text: colors.white},
  secondary: {bg: colors.brand.black, text: colors.white},
  outline: {bg: 'transparent', text: colors.brand.blue, border: colors.brand.blue},
  danger: {bg: colors.brand.danger, text: colors.white},
  ghost: {bg: 'transparent', text: colors.text.secondary},
};

const SIZE_PADDING: Record<string, {v: number; h: number}> = {
  sm: {v: spacing.sm, h: spacing.md},
  md: {v: spacing.md - 2, h: spacing.lg},
  lg: {v: spacing.md, h: spacing.xl},
};

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const v = VARIANT_STYLES[variant];
  const p = SIZE_PADDING[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        {
          backgroundColor: disabled ? colors.disabled : v.bg,
          paddingVertical: p.v,
          paddingHorizontal: p.h,
          borderColor: v.border ?? 'transparent',
          borderWidth: v.border ? 1.5 : 0,
          alignSelf: fullWidth ? 'stretch' : 'auto',
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={v.text}
        />
      ) : (
        <Text
          style={[
            styles.text,
            {color: disabled ? colors.text.light : v.text},
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: 44,
  },
  text: {
    ...typography.button,
  },
});
