import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {AppNotification} from '../types';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({notification, onPress}) => {
  // TODO: Implement notification item UI
  // - Icon based on notification type
  // - Title/body text
  // - Read/unread visual state
  // - Relative timestamp
  return (
    <TouchableOpacity onPress={() => onPress(notification)} style={styles.container}>
      <Text>{notification.type}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});
