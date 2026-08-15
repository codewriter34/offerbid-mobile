import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';

interface SafetyBannerProps {
  hubLocation?: string;
}

export const SafetyBanner: React.FC<SafetyBannerProps> = ({hubLocation}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Safety Reminder</Text>
      <Text style={styles.message}>
        Meet in a public place to complete your deal.
        {hubLocation
          ? ` Suggested meetup: ${hubLocation}.`
          : ' Choose a busy, well-lit area.'}
        {'\n'}Never share personal financial details.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF8E1',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  title: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  message: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
