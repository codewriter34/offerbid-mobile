import React from 'react';
import {ActivityIndicator, View, Text, StyleSheet} from 'react-native';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing} from '@shared/theme/spacing';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'large',
  message,
  fullScreen = true,
}) => {
  return (
    <View style={[styles.container, !fullScreen && styles.inline]}>
      <ActivityIndicator size={size} color={colors.brand.blue} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  inline: {
    flex: 0,
    paddingVertical: spacing.xl,
  },
  message: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.md,
  },
});
