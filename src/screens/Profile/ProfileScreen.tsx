import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const ProfileScreen: React.FC = () => {
  // TODO: Implement unified buyer/seller profile
  // 1. Display user info (name, hub, verification status)
  // 2. My listings section
  // 3. Active listing count / scam guard status
  // 4. Hub change option
  // 5. Logout
  return (
    <View style={styles.container}>
      <Text>Profile Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
