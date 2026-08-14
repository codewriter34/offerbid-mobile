import React from 'react';
import {ActivityIndicator, View, StyleSheet} from 'react-native';
import {colors} from '../theme/colors';

interface LoadingSpinnerProps {
  size?: 'small' | 'large';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({size = 'large'}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, justifyContent: 'center', alignItems: 'center'},
});
