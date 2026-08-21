import React, {useEffect, useCallback, useMemo, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {MainTabScreenProps} from '@app/navigation/types';
import {useBids} from '@features/bids/useBids';
import {useRealtimeUser} from '@features/bids/useRealtimeBids';
import {useAuthStore} from '@features/auth/authStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {openDealWhatsApp, openWhatsAppUrl} from '@shared/lib/whatsapp';
import {contactSeller} from '@features/listings/listingService';
import {MyBidCard} from '@features/bids/components/MyBidCard';
import {EmptyState} from '@shared/ui/EmptyState';
import {ErrorView} from '@shared/ui/ErrorView';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {AppShell} from '@shared/ui/AppShell';
import {NotificationBell} from '@shared/ui/NotificationBell';
import {FilterChip} from '@shared/ui/FilterChip';
import {AppIcon} from '@shared/ui/AppIcon';
import {colors} from '@shared/theme/colors';
import {Bid} from '@shared/types';

type Props = MainTabScreenProps<'MyBids'>;
type Filter = 'all' | 'active' | 'accepted' | 'closed';
type SortKey = 'recent' | 'highest' | 'expiring';

const FILTERS: Array<{key: Filter; label: string; color: string}> = [
  {key: 'all', label: 'All', color: '#2070C8'},
  {key: 'active', label: 'Active', color: '#2070C8'},
  {key: 'accepted', label: 'Accepted', color: '#059669'},
  {key: 'closed', label: 'Closed', color: '#64748B'},
];

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most recent',
  highest: 'Highest offer',
  expiring: 'Expiring soon',
};

function bidGroup(status: string): Exclude<Filter, 'all'> {
  const s = String(status).toUpperCase();
  if (s === 'PENDING' || s === 'COUNTERED') return 'active';
  if (s === 'ACCEPTED') return 'accepted';
  return 'closed';
}

export const MyBidsScreen: React.FC<Props> = ({navigation}) => {
  const user = useAuthStore(s => s.user);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const {myBids, isLoading, error, fetchMyBids, respondToCounter} = useBids();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('recent');

  useRealtimeUser(user?.id);

  useEffect(() => {
    fetchMyBids();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMyBids();
    setRefreshing(false);
  }, [fetchMyBids]);

  const counts = useMemo(() => {
    const next = {all: myBids.length, active: 0, accepted: 0, closed: 0};
    myBids.forEach(bid => {
      next[bidGroup(bid.status)] += 1;
    });
    return next;
  }, [myBids]);

  const visibleBids = useMemo(() => {
    const filtered =
      filter === 'all' ? myBids : myBids.filter(bid => bidGroup(bid.status) === filter);

    return [...filtered].sort((a, b) => {
      if (sort === 'highest') return b.amount - a.amount;
      if (sort === 'expiring') {
        const aEnd = a.expiresAt ? new Date(a.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        const bEnd = b.expiresAt ? new Date(b.expiresAt).getTime() : Number.MAX_SAFE_INTEGER;
        return aEnd - bEnd;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [myBids, filter, sort]);

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
    if (bid.listingId) {
      try {
        const url = await contactSeller(bid.listingId);
        await openWhatsAppUrl(url);
        return;
      } catch {
        // Fall through to the shared empty-link message
      }
    }
    await openDealWhatsApp(null);
  };

  const openManage = (bid: Bid) => {
    navigation.navigate('SubmitBid', {
      listingId: bid.listingId,
      listingTitle: bid.listingTitle ?? 'Listing',
      minBid: bid.minBidPrice ?? 0,
      startingPrice: bid.askingPrice ?? bid.amount,
      currency: bid.currency,
      bidId: bid.id,
      currentAmount: bid.amount,
    });
  };

  const openRecounter = (bid: Bid) => {
    navigation.navigate('SubmitBid', {
      listingId: bid.listingId,
      listingTitle: bid.listingTitle ?? 'Listing',
      minBid: bid.minBidPrice ?? 0,
      startingPrice: bid.askingPrice ?? bid.amount,
      recounter: true,
      sellerCounterAmount: bid.counterAmount ?? bid.amount,
      currentAmount: bid.amount,
      currency: bid.currency,
    });
  };

  const chooseSort = () => {
    Alert.alert('Sort by', undefined, [
      {text: 'Most recent', onPress: () => setSort('recent')},
      {text: 'Highest offer', onPress: () => setSort('highest')},
      {text: 'Expiring soon', onPress: () => setSort('expiring')},
      {text: 'Cancel', style: 'cancel'},
    ]);
  };

  const header = (
    <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[22px] font-bold text-brand-black">My Offers</Text>
          <Text className="mt-0.5 text-sm text-brand-gray">
            Track and manage all your offers in one place.
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {counts.active > 0 ? (
            <View className="rounded-full px-2.5 py-1" style={{backgroundColor: '#FEF3C7'}}>
              <Text className="text-[12px] font-bold" style={{color: '#B45309'}}>
                {counts.active} need attention
              </Text>
            </View>
          ) : null}
          <NotificationBell
            unreadCount={unreadCount}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>
      </View>

      <View className="mt-3.5 flex-row flex-wrap gap-2">
        {FILTERS.map(item => (
          <FilterChip
            key={item.key}
            label={item.label}
            count={counts[item.key]}
            color={item.color}
            active={filter === item.key}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <TouchableOpacity onPress={chooseSort} hitSlop={8}>
          <Text className="text-[13px] font-semibold text-brand-charcoal">
            Sort by: {SORT_LABELS[sort]}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading && myBids.length === 0) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          {header}
          <LoadingSpinner message="Loading your bids..." />
        </View>
      </AppShell>
    );
  }

  if (error && myBids.length === 0) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          {header}
          <ErrorView message={error} onRetry={fetchMyBids} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View className="flex-1 bg-brand-white">
        {header}
        <FlatList
          data={visibleBids}
          keyExtractor={item => item.id}
          contentContainerClassName="grow px-4 pt-3 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2070C8']}
            />
          }
          renderItem={({item}) => (
            <MyBidCard
              bid={item}
              onView={bid =>
                navigation.navigate('ListingDetail', {listingId: bid.listingId})
              }
              onManage={openManage}
              onAcceptCounter={handleAcceptCounter}
              onDeclineCounter={handleRejectCounter}
              onRecounter={openRecounter}
              onWhatsApp={handleWhatsApp}
            />
          )}
          ListFooterComponent={
            visibleBids.length > 0 ? (
              <View className="mt-1 flex-row items-center rounded-2xl bg-[#D1FAE5] px-3.5 py-3">
                <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white">
                  <AppIcon name="star" size={16} color={colors.success} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-bold text-brand-black">
                    Increase your chances
                  </Text>
                  <Text className="mt-0.5 text-[12px] leading-4 text-brand-charcoal">
                    Sellers are more likely to accept offers close to the asking price.
                  </Text>
                </View>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'all' ? 'No bids yet' : 'Nothing here'}
              message={
                filter === 'all'
                  ? 'Offers you make on listings will show up here.'
                  : 'No bids in this filter.'
              }
              actionLabel={filter === 'all' ? 'Browse listings' : undefined}
              onAction={
                filter === 'all'
                  ? () => navigation.navigate('MainTabs', {screen: 'Explore'})
                  : undefined
              }
            />
          }
        />
      </View>
    </AppShell>
  );
};
