import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ListingCategory} from '../types';

interface CategoryBadgeProps {
  category: ListingCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({category}) => {
  // TODO: Style with brand colors per category
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{category}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4},
  text: {fontSize: 12},
});
