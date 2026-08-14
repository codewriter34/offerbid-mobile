import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const HubSelectScreen: React.FC = () => {
  // TODO: Implement hub selection
  // 1. Display country list (Cameroon, Nigeria)
  // 2. On country select, show city + neighborhoods
  // 3. On neighborhood select, call API to set hub
  // 4. Navigate to MainTabs
  return (
    <View style={styles.container}>
      <Text>Hub Selection Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
