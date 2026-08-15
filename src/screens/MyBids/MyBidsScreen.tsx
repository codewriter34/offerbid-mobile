import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl, Alert} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useBids} from '../../hooks/useBids';
import {useRealtimeUser} from '../../hooks/useRealtimeBids';
import {useAuthStore} from '../../store/authStore';
import {openWhatsApp, openWhatsAppUrl} from '../../services/whatsappBridge';
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
  const {myBids, isLoading, error, fetchMyBids, respondToCounter} = useBids();
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
      const updated = await respondToCounter(bidId, {action: 'ACCEPT'});
      if (updated.whatsappUrl) {
        await openWhatsAppUrl(updated.whatsappUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleRejectCounter = async (bidId: string) => {
    try {
      await respondToCounter(bidId, {action: 'REJECT'});
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWhatsApp = async (bid: Bid) => {
    if (bid.whatsappUrl) {
      await openWhatsAppUrl(bid.whatsappUrl);
      return;
    }
    openWhatsApp({
      sellerPhone: '',
      itemTitle: bid.listingTitle ?? 'Item',
      acceptedPrice: bid.amount,
      hubLocation: selectedHub?.neighborhood ?? user?.location ?? '',
    });
  };

  if (isLoading && myBids.length === 0) {
    return <LoadingSpinner message="Loading your bids..." />;
  }

  if (error && myBids.length === 0) {
    return <ErrorView message={error} onRetry={fetchMyBids} />;
  }

  const pendingBids = myBids.filter(b => {
    const s = String(b.status).toUpperCase();
    return s === 'PENDING' || s === 'COUNTERED';
  });
  const resolvedBids = myBids.filter(b => {
    const s = String(b.status).toUpperCase();
    return s !== 'PENDING' && s !== 'COUNTERED';
  });

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
              String(item.status).toUpperCase() === 'COUNTERED'
                ? handleAcceptCounter
                : undefined
            }
            onReject={
              String(item.status).toUpperCase() === 'COUNTERED'
                ? handleRejectCounter
                : undefined
            }
            onWhatsApp={
              String(item.status).toUpperCase() === 'ACCEPTED'
                ? handleWhatsApp
                : undefined
            }
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
