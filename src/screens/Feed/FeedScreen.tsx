import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const FeedScreen: React.FC = () => {
  // TODO: Implement feed
  // 1. Fetch listings filtered by user's hub
  // 2. Category/price/recency filters
  // 3. Pull-to-refresh + infinite scroll pagination
  // 4. Navigate to ListingDetail on card tap
  // 5. FAB to navigate to CreateListing
  return (
    <View style={styles.container}>
      <Text>Feed Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
