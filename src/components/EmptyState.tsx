import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

interface EmptyStateProps {
  title: string;
  message: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({title, message}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  title: {fontSize: 18, fontWeight: '600', marginBottom: 8},
  message: {fontSize: 14, color: '#666', textAlign: 'center'},
});
