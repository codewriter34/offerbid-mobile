import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {MainTabScreenProps} from '@app/navigation/types';
import {useFeed} from '@features/listings/useFeed';
import {useRealtimeBids} from '@features/bids/useRealtimeBids';
import {useAuthStore} from '@features/auth/authStore';
import {useHubStore} from '@features/auth/hubStore';
import {ListingCard} from '@features/listings/components/ListingCard';
import {EmptyState} from '@shared/ui/EmptyState';
import {ErrorView} from '@shared/ui/ErrorView';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {AppShell} from '@shared/ui/AppShell';
import {Logo} from '@shared/ui/Logo';
import {GuestInvite} from '@shared/ui/GuestInvite';
import {NotificationBell} from '@shared/ui/NotificationBell';
import {useNotifications} from '@features/notifications/useNotifications';

type Props = MainTabScreenProps<'Explore'>;

export const FeedScreen: React.FC<Props> = ({navigation}) => {
  const {
    listings,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    error,
    filters,
    fetchListings,
    loadMore,
    setFilters,
  } = useFeed();
  const user = useAuthStore(s => s.user);
  const categories = useHubStore(s => s.categories);
  const {unreadCount, fetchNotifications} = useNotifications();
  const [searchText, setSearchText] = useState('');

  useRealtimeBids();

  useEffect(() => {
    void fetchListings(false);
  }, [filters.category, filters.sortBy, fetchListings]);

  useEffect(() => {
    if (user) {
      void fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  const handleRefresh = useCallback(() => {
    fetchListings(true);
    if (user) {
      void fetchNotifications();
    }
  }, [fetchListings, user, fetchNotifications]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSearch = useCallback(() => {
    setFilters({search: searchText});
    fetchListings(true);
  }, [searchText, setFilters, fetchListings]);

  const handleCategoryFilter = (category: string | null) => {
    setFilters({category});
  };

  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail', {listingId: id});
  };

  const header = (
    <View className="mb-2 flex-row items-center justify-between gap-2 px-4">
      <View className="min-w-0 flex-1 flex-row items-center gap-2">
        <Logo size={36} />
        <Text className="text-[22px] font-bold text-brand-black">OfferBid</Text>
      </View>
      <View className="flex-row items-center gap-2">
        <NotificationBell
          unreadCount={user ? unreadCount : 0}
          onPress={() =>
            user
              ? navigation.navigate('Notifications')
              : navigation.navigate('Auth', {screen: 'Login'})
          }
        />
        {!user ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth')}
            accessibilityRole="button">
            <Text className="text-sm font-bold text-brand-blue">Log in</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );

  if (isLoading && listings.length === 0 && !isRefreshing) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          <View className="border-b border-slate-200 bg-white pb-2 pt-2">
            {header}
          </View>
          <LoadingSpinner message="Loading listings..." />
        </View>
      </AppShell>
    );
  }

  if (error && listings.length === 0) {
    return (
      <AppShell>
        <View className="flex-1 bg-brand-white">
          <View className="border-b border-slate-200 bg-white pb-2 pt-2">
            {header}
          </View>
          <ErrorView message={error} onRetry={handleRefresh} />
        </View>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <View className="flex-1 bg-brand-white">
        <View className="border-b border-slate-200 bg-white pb-2 pt-2">
          {header}

          <View className="mb-2 px-4">
            <TextInput
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-base text-brand-black"
              placeholder="Search listings..."
              placeholderTextColor="#64748B"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {!user ? (
              <GuestInvite onPress={() => navigation.navigate('Auth')} />
            ) : null}
          </View>

          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[null, ...categories]}
            keyExtractor={item => item ?? 'all'}
            contentContainerClassName="gap-2 px-4 pb-2"
            renderItem={({item}) => {
              const isActive = filters.category === item;
              return (
                <TouchableOpacity
                  className={`rounded-full border px-4 py-1.5 ${
                    isActive
                      ? 'border-brand-blue bg-brand-blue'
                      : 'border-slate-200 bg-brand-white'
                  }`}
                  onPress={() => handleCategoryFilter(item)}>
                  <Text
                    className={`text-sm ${
                      isActive ? 'font-semibold text-white' : 'text-brand-charcoal'
                    }`}>
                    {item ?? 'All'}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        <FlatList
          data={listings}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperClassName="gap-3"
          contentContainerClassName="grow px-4 pt-3 pb-4"
          renderItem={({item}) => (
            <View className="mb-3 flex-1">
              <ListingCard listing={item} onPress={handleListingPress} compact />
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#2070C8']}
            />
          }
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <ActivityIndicator size="small" color="#2070C8" className="py-6" />
            ) : null
          }
          ListEmptyComponent={
            <EmptyState
              title="No listings yet"
              message="Be the first to post something."
              actionLabel={user ? 'Create Listing' : 'Login/Signup'}
              onAction={() =>
                navigation.navigate(user ? 'CreateListing' : 'Auth')
              }
            />
          }
        />
      </View>
    </AppShell>
  );
};
