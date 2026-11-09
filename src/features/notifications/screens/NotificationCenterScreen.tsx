import React, {useCallback, useState} from 'react';
import {View, Text, FlatList, TouchableOpacity, RefreshControl, Alert} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackScreenProps} from '@app/navigation/types';
import {dismissScreen} from '@app/navigation/navigationRef';
import {useNotifications} from '@features/notifications/useNotifications';
import {NotificationItem} from '@features/notifications/components/NotificationItem';
import {EmptyState} from '@shared/ui/EmptyState';
import {ErrorView} from '@shared/ui/ErrorView';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {listingIdFromPushData} from '@features/notifications/pushService';
import {AppNotification} from '@shared/types';

type Props = RootStackScreenProps<'Notifications'>;

export const NotificationCenterScreen: React.FC<Props> = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void fetchNotifications();
    }, [fetchNotifications]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchNotifications]);

  const handleDeleteNotification = (notification: AppNotification) => {
    Alert.alert('Delete notification', 'Remove this notification?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => void deleteNotification(notification.id),
      },
    ]);
  };


  const handleNotificationPress = (notification: AppNotification) => {
    if (!notification.read) {
      void markAsRead(notification.id);
    }

    const listingId = listingIdFromPushData(
      notification.payload as Record<string, unknown> | undefined,
    );
    if (listingId) {
      navigation.replace('ListingDetail', {listingId});
      return;
    }
    dismissScreen(navigation);
  };

  return (
    <View className="flex-1 bg-white" style={{paddingTop: insets.top}}>
      <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
        <TouchableOpacity onPress={() => dismissScreen(navigation)} hitSlop={12}>
          <Text className="text-base font-semibold text-brand-charcoal">Close</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-brand-black">Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => void markAllAsRead()} hitSlop={8}>
            <Text className="text-[13px] font-semibold text-brand-blue">Mark all</Text>
          </TouchableOpacity>
        ) : (
          <View className="w-14" />
        )}
      </View>

      {isLoading && notifications.length === 0 ? (
        <LoadingSpinner message="Loading notifications..." />
      ) : error && notifications.length === 0 ? (
        <ErrorView message={error} onRetry={fetchNotifications} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2070C8']}
            />
          }
          renderItem={({item}) => (
            <NotificationItem
              notification={item}
              onPress={handleNotificationPress}
              onLongPress={handleDeleteNotification}
            />
          )}
          ListEmptyComponent={
            <View className="py-16">
              <EmptyState
                title="No notifications"
                message="You’re all caught up. Offer and listing updates will show up here."
              />
            </View>
          }
        />
      )}
    </View>
  );
};
