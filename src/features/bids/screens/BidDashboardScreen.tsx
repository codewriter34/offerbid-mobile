import React, {useEffect, useCallback, useMemo, useState} from 'react';
import {View, Text, ScrollView, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {MainTabScreenProps} from '@app/navigation/types';
import {useBids} from '@features/bids/useBids';
import {useMyListings} from '@features/listings/useMyListings';
import {useRealtimeUser} from '@features/bids/useRealtimeBids';
import {useAuthStore} from '@features/auth/authStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {openDealWhatsApp, openWhatsAppUrl} from '@shared/lib/whatsapp';
import {listingImageUrl} from '@api/normalize';
import {IncomingOfferCard} from '@features/bids/components/IncomingOfferCard';
import {EmptyState} from '@shared/ui/EmptyState';
import {ErrorView} from '@shared/ui/ErrorView';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {AppShell} from '@shared/ui/AppShell';
import {NotificationBell} from '@shared/ui/NotificationBell';
import {FilterChip} from '@shared/ui/FilterChip';
import {formatPrice} from '@shared/lib/formatters';
import {shadows} from '@shared/theme/shadows';
import {AppIcon} from '@shared/ui/AppIcon';
import {MediaThumb} from '@shared/ui/CachedImage';
import {colors} from '@shared/theme/colors';
import {Bid, Listing} from '@shared/types';

type Props = MainTabScreenProps<'Selling'>;
type ListingFilter = 'all' | 'active' | 'sold' | 'closed';
type OfferFilter = 'all' | 'pending' | 'accepted' | 'countered' | 'closed';

const LISTING_FILTERS: Array<{key: ListingFilter; label: string; color: string}> = [
  {key: 'all', label: 'All', color: '#2070C8'},
  {key: 'active', label: 'Active', color: '#2070C8'},
  {key: 'sold', label: 'Sold', color: '#059669'},
  {key: 'closed', label: 'Closed', color: '#64748B'},
];

const OFFER_FILTERS: Array<{key: OfferFilter; label: string; color: string}> = [
  {key: 'all', label: 'All', color: '#2070C8'},
  {key: 'pending', label: 'Pending', color: '#B45309'},
  {key: 'accepted', label: 'Accepted', color: '#059669'},
  {key: 'countered', label: 'Countered', color: '#1D4ED8'},
  {key: 'closed', label: 'Closed', color: '#64748B'},
];

function listingGroup(status: string): Exclude<ListingFilter, 'all'> {
  const s = String(status).toUpperCase();
  if (s === 'ACTIVE') return 'active';
  if (s === 'SOLD') return 'sold';
  return 'closed';
}

function offerGroup(status: string): Exclude<OfferFilter, 'all'> {
  const s = String(status).toUpperCase();
  if (s === 'PENDING') return 'pending';
  if (s === 'ACCEPTED') return 'accepted';
  if (s === 'COUNTERED') return 'countered';
  return 'closed';
}

function StatCard({
  value,
  label,
  bg,
  fg,
}: {
  value: number;
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <View className="min-w-0 flex-1 items-center rounded-xl px-1 py-2.5" style={{backgroundColor: bg}}>
      <Text className="text-[18px] font-bold" style={{color: fg}}>
        {value}
      </Text>
      <Text
        className="mt-0.5 text-center text-[10px] font-semibold leading-3 text-brand-black"
        numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export const BidDashboardScreen: React.FC<Props> = ({navigation}) => {
  const user = useAuthStore(s => s.user);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const {incomingBids, isLoading, error, fetchIncomingBids, respondToBid} = useBids();
  const {myListings, fetchMyListings} = useMyListings();
  const [refreshing, setRefreshing] = useState(false);
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all');
  const [offerFilter, setOfferFilter] = useState<OfferFilter>('all');

  useRealtimeUser(user?.id);

  useEffect(() => {
    fetchIncomingBids();
    fetchMyListings();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchIncomingBids(), fetchMyListings()]);
    setRefreshing(false);
  }, [fetchIncomingBids, fetchMyListings]);

  const pendingOffers = incomingBids.filter(
    bid => String(bid.status).toUpperCase() === 'PENDING',
  );
  const acceptedOffers = incomingBids.filter(
    bid => String(bid.status).toUpperCase() === 'ACCEPTED',
  );
  const activeListings = myListings.filter(
    listing => String(listing.status).toUpperCase() === 'ACTIVE',
  );
  const soldListings = myListings.filter(
    listing => String(listing.status).toUpperCase() === 'SOLD',
  );

  const listingCounts = useMemo(() => {
    const next = {all: myListings.length, active: 0, sold: 0, closed: 0};
    myListings.forEach(listing => {
      next[listingGroup(listing.status)] += 1;
    });
    return next;
  }, [myListings]);

  const visibleListings = useMemo(() => {
    if (listingFilter === 'all') return myListings;
    return myListings.filter(listing => listingGroup(listing.status) === listingFilter);
  }, [myListings, listingFilter]);

  const visibleOffers = useMemo(() => {
    if (offerFilter === 'all') return incomingBids;
    return incomingBids.filter(bid => offerGroup(bid.status) === offerFilter);
  }, [incomingBids, offerFilter]);

  const offerCounts = useMemo(() => {
    const next = {all: incomingBids.length, pending: 0, accepted: 0, countered: 0, closed: 0};
    incomingBids.forEach(bid => {
      next[offerGroup(bid.status)] += 1;
    });
    return next;
  }, [incomingBids]);

  const handleAccept = async (bidId: string) => {
    Alert.alert(
      'Accept Bid',
      'Accept this offer? The buyer will be able to contact you on WhatsApp.',
      [
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
      ],
    );
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
    const bid = incomingBids.find(item => item.id === bidId);
    navigation.navigate('CounterBid', {
      bidId,
      currentAmount: bid?.amount ?? 0,
      listingTitle: bid?.listingTitle ?? 'Listing',
      currency: bid?.currency,
    });
  };

  const handleWhatsApp = async (bid: Bid) => {
    if (bid.whatsappUrl) {
      await openWhatsAppUrl(bid.whatsappUrl);
      return;
    }
    await openDealWhatsApp(null);
  };

  const header = (
    <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2">
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[22px] font-bold text-brand-black">Selling</Text>
          <Text className="mt-0.5 text-sm text-brand-gray">
            Manage your listings, offers and sales.
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          {pendingOffers.length > 0 ? (
            <View className="rounded-full px-2.5 py-1" style={{backgroundColor: '#FEF3C7'}}>
              <Text className="text-[12px] font-bold" style={{color: '#B45309'}}>
                {pendingOffers.length} need attention
              </Text>
            </View>
          ) : null}
          <NotificationBell
            unreadCount={unreadCount}
            onPress={() => navigation.navigate('Notifications')}
          />
        </View>
      </View>
    </View>
  );

  if (isLoading && incomingBids.length === 0 && myListings.length === 0) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          {header}
          <LoadingSpinner message="Loading your listings..." />
        </View>
      </AppShell>
    );
  }

  if (error && incomingBids.length === 0 && myListings.length === 0) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          {header}
          <ErrorView message={error} onRetry={handleRefresh} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View className="flex-1 bg-brand-white">
        {header}
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-6 pt-3"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2070C8']}
            />
          }>
          <View className="mb-3 flex-row gap-2">
            <StatCard
              value={pendingOffers.length}
              label="Offers"
              bg="#FEF3C7"
              fg="#B45309"
            />
            <StatCard
              value={activeListings.length}
              label="Active"
              bg="#DBEAFE"
              fg="#2070C8"
            />
            <StatCard
              value={soldListings.length}
              label="Sold"
              bg="#D1FAE5"
              fg="#047857"
            />
            <StatCard
              value={acceptedOffers.length}
              label="Accepted"
              bg="#F1F5F9"
              fg="#334155"
            />
          </View>

          <View className="mb-3 flex-row flex-wrap gap-2">
            {OFFER_FILTERS.map(item => (
              <FilterChip
                key={item.key}
                label={item.label}
                count={offerCounts[item.key]}
                color={item.color}
                active={offerFilter === item.key}
                onPress={() => setOfferFilter(item.key)}
              />
            ))}
          </View>

          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Text className="text-[17px] font-bold text-brand-black">Incoming Offers</Text>
              {pendingOffers.length > 0 ? (
                <View className="h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-danger px-1.5">
                  <Text className="text-[11px] font-bold text-white">
                    {pendingOffers.length}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {visibleOffers.length === 0 ? (
            <View className="mb-5 rounded-2xl border border-slate-200 bg-white px-4 py-6">
              <Text className="text-center text-sm text-brand-gray">
                {offerFilter === 'all'
                  ? 'When buyers make offers, they will show up here.'
                  : 'No offers match this filter.'}
              </Text>
            </View>
          ) : (
            visibleOffers.map(bid => (
              <IncomingOfferCard
                key={bid.id}
                bid={bid}
                onView={item =>
                  navigation.navigate('ListingDetail', {listingId: item.listingId})
                }
                onAccept={handleAccept}
                onReject={handleReject}
                onCounter={handleCounter}
                onWhatsApp={handleWhatsApp}
              />
            ))
          )}

          <Text className="mb-2 mt-2 text-[17px] font-bold text-brand-black">
            Your Listings
          </Text>
          <View className="mb-3 flex-row flex-wrap gap-2">
            {LISTING_FILTERS.map(item => (
              <FilterChip
                key={item.key}
                label={item.label}
                count={listingCounts[item.key]}
                color={item.color}
                active={listingFilter === item.key}
                onPress={() => setListingFilter(item.key)}
              />
            ))}
          </View>

          {visibleListings.length === 0 ? (
            <EmptyState
              title="No listings yet"
              message="Post something to start receiving offers."
              actionLabel="Create Listing"
              onAction={() => navigation.navigate('CreateListing')}
            />
          ) : (
            visibleListings.map(listing => (
              <ListingRow
                key={listing.id}
                listing={listing}
                onPress={() =>
                  navigation.navigate('ListingDetail', {listingId: listing.id})
                }
              />
            ))
          )}

          <View className="mt-2 flex-row items-center rounded-2xl bg-[#D1FAE5] px-3.5 py-3">
            <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white">
              <AppIcon name="star" size={16} color={colors.success} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[13px] font-bold text-brand-black">
                Increase your chances
              </Text>
              <Text className="mt-0.5 text-[12px] leading-4 text-brand-charcoal">
                Respond quickly. Sellers who reply within an hour are more likely to close.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </AppShell>
  );
};

function ListingRow({
  listing,
  onPress,
}: {
  listing: Listing;
  onPress: () => void;
}) {
  const status = String(listing.status).toUpperCase();
  const chip =
    status === 'ACTIVE'
      ? {bg: '#DBEAFE', fg: '#2070C8', label: 'Active'}
      : status === 'SOLD'
        ? {bg: '#D1FAE5', fg: '#047857', label: 'Sold'}
        : {bg: '#F1F5F9', fg: '#64748B', label: 'Closed'};
  const image = listingImageUrl(listing);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3 py-3"
      style={shadows.card}>
      <MediaThumb
        uri={image}
        recyclingKey={listing.id}
        className="h-14 w-14 rounded-xl"
        iconSize={16}
      />
      <View className="ml-3 min-w-0 flex-1">
        <Text className="text-[15px] font-bold text-brand-black" numberOfLines={1}>
          {listing.title}
        </Text>
        <Text className="mt-0.5 text-sm font-semibold text-brand-black">
          {formatPrice(listing.askingPrice, listing.currency)}
        </Text>
        {listing.category ? (
          <Text className="mt-0.5 text-[12px] text-brand-gray">{listing.category}</Text>
        ) : null}
      </View>
      <View className="rounded-full px-2.5 py-1" style={{backgroundColor: chip.bg}}>
        <Text className="text-[11px] font-bold" style={{color: chip.fg}}>
          {chip.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
