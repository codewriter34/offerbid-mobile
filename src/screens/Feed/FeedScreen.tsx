import React, {useEffect, useCallback, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {ListingCategory} from '../../types/listing';
import {useListings} from '../../hooks/useListings';
import {useAuthStore} from '../../store/authStore';
import {LISTING_CATEGORIES} from '../../config/hubs';
import {ListingCard} from '../../components/ListingCard';
import {EmptyState} from '../../components/EmptyState';
import {ErrorView} from '../../components/ErrorView';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {CategoryBadge} from '../../components/CategoryBadge';
import {Logo} from '../../components/Logo';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = MainTabScreenProps<'Feed'>;

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
    resetFilters,
  } = useListings();
  const selectedHub = useAuthStore(s => s.selectedHub);
  const user = useAuthStore(s => s.user);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchListings(true);
  }, [filters.category, filters.sortBy]);

  const handleRefresh = useCallback(() => {
    fetchListings(true);
  }, [fetchListings]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  const handleSearch = useCallback(() => {
    setFilters({search: searchText});
    fetchListings(true);
  }, [searchText]);

  const handleCategoryFilter = (category: ListingCategory | null) => {
    setFilters({category});
  };

  const handleListingPress = (id: string) => {
    navigation.navigate('ListingDetail', {listingId: id});
  };

  if (isLoading && listings.length === 0 && !isRefreshing) {
    return <LoadingSpinner message="Loading listings..." />;
  }

  if (error && listings.length === 0) {
    return <ErrorView message={error} onRetry={handleRefresh} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.brand}>
            <Logo size={36} />
            <View>
              <Text style={styles.greeting}>OfferBid</Text>
              {(selectedHub || user?.city) && (
                <Text style={styles.hubLabel}>
                  {selectedHub
                    ? `${selectedHub.neighborhood}, ${selectedHub.city}`
                    : [user?.location, user?.city].filter(Boolean).join(', ')}
                </Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('CreateListing')}>
            <Text style={styles.addButtonText}>+ Sell</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search listings..."
            placeholderTextColor={colors.text.light}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[null, ...LISTING_CATEGORIES]}
          keyExtractor={item => item ?? 'all'}
          contentContainerStyle={styles.filterRow}
          renderItem={({item}) => {
            const isActive = filters.category === item;
            return (
              <TouchableOpacity
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleCategoryFilter(item as ListingCategory | null)}>
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}>
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
        contentContainerStyle={styles.listContent}
        renderItem={({item}) => (
          <ListingCard listing={item} onPress={handleListingPress} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loadingMore}
            />
          ) : null
        }
        ListEmptyComponent={
          <EmptyState
            title="No listings yet"
            message="Be the first to post something in your area!"
            actionLabel="Create Listing"
            onAction={() => navigation.navigate('CreateListing')}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.white,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
    paddingRight: spacing.sm,
  },
  greeting: {
    ...typography.h2,
    color: colors.text.primary,
  },
  hubLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 14,
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    ...typography.body,
    color: colors.text.primary,
  },
  filterRow: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm - 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.black,
    fontWeight: '600',
  },
  listContent: {
    padding: spacing.md,
    flexGrow: 1,
  },
  loadingMore: {
    paddingVertical: spacing.lg,
  },
});
