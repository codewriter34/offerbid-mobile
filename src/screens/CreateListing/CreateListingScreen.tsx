import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const CreateListingScreen: React.FC = () => {
  // TODO: Implement create listing
  // 1. Image picker (up to 4 photos)
  // 2. Client-side compression via react-native-image-resizer
  // 3. Upload to Cloudinary unsigned endpoint
  // 4. Form: title, description, category, starting price, min bid
  // 5. Scam Guard check (3-listing limit for unverified)
  // 6. Submit to POST /listings
  return (
    <View style={styles.container}>
      <Text>Create Listing Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
