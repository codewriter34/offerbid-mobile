import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  TouchableOpacity,
} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useBids} from '../../hooks/useBids';
import {useRealtimeUser} from '../../hooks/useRealtimeBids';
import {useAuthStore} from '../../store/authStore';
import {openWhatsApp, openWhatsAppUrl} from '../../services/whatsappBridge';
import {BidCard} from '../../components/BidCard';
import {EmptyState} from '../../components/EmptyState';
import {ErrorView} from '../../components/ErrorView';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {Button} from '../../components/Button';
import {Bid} from '../../types';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = MainTabScreenProps<'BidDashboard'>;

export const BidDashboardScreen: React.FC<Props> = ({navigation}) => {
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const {incomingBids, isLoading, error, fetchIncomingBids, respondToBid} = useBids();
  const [refreshing, setRefreshing] = useState(false);
  const [counterModalVisible, setCounterModalVisible] = useState(false);
  const [counterBidId, setCounterBidId] = useState<string | null>(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [counterSubmitting, setCounterSubmitting] = useState(false);

  useRealtimeUser(user?.id);

  useEffect(() => {
    fetchIncomingBids();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchIncomingBids();
    setRefreshing(false);
  }, []);

  const handleAccept = async (bidId: string) => {
    Alert.alert('Accept Bid', 'Accept this offer? The buyer will be able to contact you on WhatsApp.', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Accept',
        onPress: async () => {
          try {
            const updated = await respondToBid(bidId, {action: 'ACCEPT'});
            if (updated.whatsappUrl) {
              await openWhatsAppUrl(updated.whatsappUrl);
            }
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleReject = async (bidId: string) => {
    Alert.alert('Reject Bid', 'Are you sure?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await respondToBid(bidId, {action: 'REJECT'});
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleCounter = (bidId: string) => {
    setCounterBidId(bidId);
    setCounterAmount('');
    setCounterModalVisible(true);
  };

  const submitCounter = async () => {
    const amount = parseFloat(counterAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid counter amount.');
      return;
    }
    setCounterSubmitting(true);
    try {
      await respondToBid(counterBidId!, {
        action: 'COUNTER',
        counterAmount: amount,
      });
      setCounterModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setCounterSubmitting(false);
    }
  };

  const handleWhatsApp = async (bid: Bid) => {
    if (bid.whatsappUrl) {
      await openWhatsAppUrl(bid.whatsappUrl);
      return;
    }
    openWhatsApp({
      sellerPhone: user?.phone ?? '',
      itemTitle: bid.listingTitle ?? 'Item',
      acceptedPrice: bid.amount,
      hubLocation: selectedHub?.neighborhood ?? user?.location ?? '',
    });
  };

  if (isLoading && incomingBids.length === 0) {
    return <LoadingSpinner message="Loading bids..." />;
  }

  if (error && incomingBids.length === 0) {
    return <ErrorView message={error} onRetry={fetchIncomingBids} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Seller Dashboard</Text>
        <Text style={styles.subtitle}>
          {incomingBids.length} incoming bid{incomingBids.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={incomingBids}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        renderItem={({item}) => (
          <BidCard
            bid={item}
            isSeller
            onAccept={handleAccept}
            onReject={handleReject}
            onCounter={handleCounter}
            onWhatsApp={handleWhatsApp}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No bids yet"
            message="When buyers make offers on your listings, they'll appear here."
          />
        }
      />

      <Modal
        visible={counterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCounterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Counter Offer</Text>
            <Text style={styles.modalLabel}>Your counter amount:</Text>
            <TextInput
              style={styles.modalInput}
              value={counterAmount}
              onChangeText={setCounterAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
              placeholderTextColor={colors.text.light}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                size="md"
                onPress={() => setCounterModalVisible(false)}
                style={{flex: 1}}
              />
              <Button
                title="Send Counter"
                variant="secondary"
                size="md"
                onPress={submitCounter}
                loading={counterSubmitting}
                style={{flex: 1}}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  header: {
    backgroundColor: colors.white,
    padding: spacing.md,
    paddingTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {...typography.h2, color: colors.text.primary},
  subtitle: {...typography.bodySmall, color: colors.text.secondary, marginTop: spacing.xs},
  list: {padding: spacing.md, flexGrow: 1},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  modalTitle: {...typography.h2, color: colors.text.primary, marginBottom: spacing.lg},
  modalLabel: {...typography.bodySmall, color: colors.text.secondary, marginBottom: spacing.sm},
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.price,
    color: colors.text.primary,
    marginBottom: spacing.lg,
  },
  modalActions: {flexDirection: 'row', gap: spacing.md},
});
