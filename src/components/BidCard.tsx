import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Bid} from '../types';

interface BidCardProps {
  bid: Bid;
  isSeller: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCounter?: (id: string) => void;
}

export const BidCard: React.FC<BidCardProps> = ({bid}) => {
  // TODO: Implement bid card UI
  // - Bid amount, status badge
  // - Countdown timer (if pending)
  // - Action buttons for seller (accept/reject/counter)
  // - WhatsApp button (if accepted)
  return (
    <View style={styles.container}>
      <Text>Bid: {bid.amount}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {padding: 16},
});
