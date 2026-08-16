import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ListingCategory} from '@shared/types';
import {typography} from '@shared/theme/typography';
import {borderRadius} from '@shared/theme/spacing';

const CATEGORY_COLORS: Record<string, {bg: string; text: string}> = {
  Tech: {bg: '#E3F2FD', text: '#1565C0'},
  Electronics: {bg: '#F3E5F5', text: '#7B1FA2'},
  Phones: {bg: '#E0F7FA', text: '#00838F'},
  Furniture: {bg: '#FFF3E0', text: '#E65100'},
  Household: {bg: '#E8F5E9', text: '#2E7D32'},
  Fashion: {bg: '#FCE4EC', text: '#C62828'},
  Beauty: {bg: '#F3E5F5', text: '#6A1B9A'},
  Books: {bg: '#FFF8E1', text: '#F57F17'},
  Sports: {bg: '#E8F5E9', text: '#1B5E20'},
  Kids: {bg: '#FFF3E0', text: '#EF6C00'},
  Vehicles: {bg: '#ECEFF1', text: '#37474F'},
  Other: {bg: '#F5F5F5', text: '#616161'},
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
