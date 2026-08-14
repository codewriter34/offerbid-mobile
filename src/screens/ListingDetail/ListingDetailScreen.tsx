import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const ListingDetailScreen: React.FC = () => {
  // TODO: Implement listing detail
  // 1. Fetch listing by ID with images
  // 2. Image carousel
  // 3. Seller info + WhatsApp button (post-acceptance)
  // 4. "Make an Offer" button for buyers
  // 5. Bid history for this listing
  return (
    <View style={styles.container}>
      <Text>Listing Detail Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
