import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, Alert} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useBids} from '../../hooks/useBids';
import {useRealtimeUser} from '../../hooks/useRealtimeBids';
import {useAuthStore} from '../../store/authStore';
import {openWhatsApp} from '../../services/whatsappBridge';
import {BidCard} from '../../components/BidCard';
import {EmptyState} from '../../components/EmptyState';
import {ErrorView} from '../../components/ErrorView';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {Bid} from '../../types';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';

type Props = MainTabScreenProps<'MyBids'>;

export const MyBidsScreen: React.FC<Props> = ({navigation}) => {
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const {myBids, isLoading, error, fetchMyBids, updateBid} = useBids();
  const [refreshing, setRefreshing] = useState(false);

  useRealtimeUser(user?.id);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyBids();
    setRefreshing(false);
  }, []);

  const handleAcceptCounter = async (bidId: string) => {
    try {
      await updateBid(bidId, {status: 'accepted'});
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRejectCounter = async (bidId: string) => {
    try {
      await updateBid(bidId, {status: 'rejected'});
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWhatsApp = (bid: Bid) => {
    openWhatsApp({
      sellerPhone: '',
      itemTitle: 'Item',
      acceptedPrice: bid.amount,
      hubLocation: selectedHub?.neighborhood ?? '',
    });
  };

  if (isLoading && myBids.length === 0) {
    return <LoadingSpinner message="Loading your bids..." />;
  }

  if (error && myBids.length === 0) {
    return <ErrorView message={error} onRetry={fetchMyBids} />;
  }

  const pendingBids = myBids.filter(b => b.status === 'pending' || b.status === 'countered');
  const resolvedBids = myBids.filter(b => b.status !== 'pending' && b.status !== 'countered');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Bids</Text>
        <Text style={styles.subtitle}>
          {pendingBids.length} active, {resolvedBids.length} resolved
        </Text>
      </View>

      <FlatList
        data={myBids}
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
            isSeller={false}
            onAccept={
              item.status === 'countered'
                ? handleAcceptCounter
                : undefined
            }
            onReject={
              item.status === 'countered'
                ? handleRejectCounter
                : undefined
            }
            onWhatsApp={item.status === 'accepted' ? handleWhatsApp : undefined}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No bids yet"
            message="Start bidding on items you like!"
            actionLabel="Browse Listings"
            onAction={() =>
              navigation.navigate('MainTabs', {screen: 'Feed'})
            }
          />
        }
      />
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
});
