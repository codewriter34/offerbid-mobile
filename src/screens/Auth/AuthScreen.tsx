import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export const AuthScreen: React.FC = () => {
  // TODO: Implement Google Sign-In flow
  // 1. Get Google ID token via @react-native-google-signin
  // 2. Send to POST /auth/google on NestJS
  // 3. Store JWT via react-native-keychain
  // 4. Navigate to HubSelect if hub_id is null, else MainTabs
  return (
    <View style={styles.container}>
      <Text>Auth Screen</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
