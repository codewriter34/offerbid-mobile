import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Listing} from '../types';

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({listing, onPress}) => {
  // TODO: Implement listing card UI
  // - Thumbnail image
  // - Title, category badge, price
  // - Hub/neighborhood label
  // - Time since posted
  return (
    <View style={styles.container}>
      <Text>{listing.title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});
