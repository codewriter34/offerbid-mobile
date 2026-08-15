import React, {useEffect, useCallback, useState} from 'react';
import {View, Text, FlatList, StyleSheet, RefreshControl} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useNotifications} from '../../hooks/useNotifications';
import {NotificationItem} from '../../components/NotificationItem';
import {EmptyState} from '../../components/EmptyState';
import {ErrorView} from '../../components/ErrorView';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {AppNotification} from '../../types';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing} from '../../theme/spacing';

type Props = MainTabScreenProps<'Notifications'>;

export const NotificationCenterScreen: React.FC<Props> = ({navigation}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, []);

  const handleNotificationPress = (notification: AppNotification) => {
    markAsRead(notification.id);

    const payload = notification.payload as {
      listing_id?: string;
      bid_id?: string;
    };

    if (payload.listing_id) {
      navigation.navigate('ListingDetail', {
        listingId: payload.listing_id,
      });
    }
  };

  if (isLoading && notifications.length === 0) {
    return <LoadingSpinner message="Loading notifications..." />;
  }

  if (error && notifications.length === 0) {
    return <ErrorView message={error} onRetry={fetchNotifications} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <Text style={styles.unreadCount}>{unreadCount} unread</Text>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
        renderItem={({item}) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationPress}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            title="No notifications"
            message="You're all caught up! Notifications about your bids and listings will appear here."
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {...typography.h2, color: colors.text.primary},
  unreadCount: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '600',
  },
});
