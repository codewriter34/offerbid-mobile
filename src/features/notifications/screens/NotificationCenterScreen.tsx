import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Pressable,
  RefreshControl,
  Dimensions,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {RootStackScreenProps} from '@app/navigation/types';
import {dismissScreen} from '@app/navigation/navigationRef';
import {useNotifications} from '@features/notifications/useNotifications';
import {NotificationItem} from '@features/notifications/components/NotificationItem';
import {EmptyState} from '@shared/ui/EmptyState';
import {ErrorView} from '@shared/ui/ErrorView';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {shadows} from '@shared/theme/shadows';
import {AppIcon} from '@shared/ui/AppIcon';
import {colors} from '@shared/theme/colors';
import {listingIdFromPushData} from '@features/notifications/pushService';
import {AppNotification} from '@shared/types';

type Props = RootStackScreenProps<'Notifications'>;

const PANEL_MAX = Dimensions.get('window').height * 0.72;

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
  } = useNotifications();
  const [refreshing, setRefreshing] = useState(false);
  const slide = useRef(new Animated.Value(-PANEL_MAX)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide]);

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

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.parallel([
      Animated.timing(slide, {
        toValue: -PANEL_MAX,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) dismissScreen(navigation);
      else closing.current = false;
    });
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
    close();
  };

  return (
    <View className="flex-1">
      <Animated.View className="absolute inset-0" style={{opacity: fade}}>
        <Pressable className="flex-1 bg-black/40" onPress={close} />
      </Animated.View>

      <Animated.View
        className="absolute left-0 right-0 top-0 overflow-hidden rounded-b-2xl bg-white"
        style={[
          shadows.dropdown,
          {
            paddingTop: insets.top,
            maxHeight: PANEL_MAX,
            transform: [{translateY: slide}],
          },
        ]}>
        <View className="flex-row items-center justify-between px-4 pb-2 pt-3">
          <Text className="text-[22px] font-extrabold text-brand-black">
            Notifications
          </Text>
          <View className="flex-row items-center gap-2">
            {unreadCount > 0 ? (
              <TouchableOpacity
                onPress={() => void markAllAsRead()}
                className="rounded-full bg-[#E7F3FF] px-3 py-1.5">
                <Text className="text-[13px] font-semibold text-brand-blue">
                  Mark all read
                </Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity
              onPress={close}
              className="h-9 w-9 items-center justify-center rounded-full bg-[#E4E6EB]"
              accessibilityRole="button"
              accessibilityLabel="Close notifications">
              <AppIcon name="close" size={16} color={colors.brand.black} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && notifications.length === 0 ? (
          <View className="py-16">
            <LoadingSpinner message="Loading notifications..." />
          </View>
        ) : error && notifications.length === 0 ? (
          <View className="py-10">
            <ErrorView message={error} onRetry={fetchNotifications} />
          </View>
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
              />
            )}
            ListEmptyComponent={
              <View className="py-10">
                <EmptyState
                  title="No notifications"
                  message="You’re all caught up. Bid and listing updates will show up here."
                />
              </View>
            }
          />
        )}
      </Animated.View>
    </View>
  );
};
