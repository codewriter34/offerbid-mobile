import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const NotificationCenterScreen: React.FC = () => {
  // TODO: Implement notification center
  // 1. Fetch notifications from API
  // 2. Display list with read/unread states
  // 3. Mark as read on tap
  // 4. Navigate to relevant screen based on notification type
  return (
    <View style={styles.container}>
      <Text>Notification Center Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
