import React from 'react';
import {Text, StyleSheet} from 'react-native';

interface CountdownTimerProps {
  expiresAt: string;
  onExpired?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({expiresAt}) => {
  // TODO: Implement countdown timer
  // - Calculate remaining time from expiresAt
  // - Update every second
  // - Call onExpired when timer reaches 0
  // - Visual warning state when < 1 hour remaining
  return <Text style={styles.timer}>--:--:--</Text>;
};

const styles = StyleSheet.create({
  timer: {fontSize: 14, fontWeight: '600'},
});
