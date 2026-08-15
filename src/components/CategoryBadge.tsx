import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ListingCategory} from '../types';
import {typography} from '../theme/typography';
import {borderRadius} from '../theme/spacing';

const CATEGORY_COLORS: Record<string, {bg: string; text: string}> = {
  Tech: {bg: '#E3F2FD', text: '#1565C0'},
  Electronics: {bg: '#F3E5F5', text: '#7B1FA2'},
  Furniture: {bg: '#FFF3E0', text: '#E65100'},
  Household: {bg: '#E8F5E9', text: '#2E7D32'},
  Fashion: {bg: '#FCE4EC', text: '#C62828'},
  Books: {bg: '#FFF8E1', text: '#F57F17'},
};

interface CategoryBadgeProps {
  category: ListingCategory | string;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({
  category,
  size = 'sm',
}) => {
  const palette = CATEGORY_COLORS[category] ?? {bg: '#F5F5F5', text: '#666'};
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          paddingHorizontal: isSmall ? 8 : 12,
          paddingVertical: isSmall ? 3 : 5,
        },
      ]}>
      <Text
        style={[
          isSmall ? styles.textSm : styles.textMd,
          {color: palette.text},
        ]}>
        {category}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  textSm: {
    ...typography.caption,
    fontWeight: '600',
  },
  textMd: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
});
