import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {AppNotification} from '@shared/types';
import {formatRelativeTime} from '@shared/lib/formatters';
import {AppIcon, AppIconName} from '@shared/ui/AppIcon';
import {
  notificationAccent,
  notificationBody,
  notificationTitle,
} from '../notificationCopy';

const TYPE_ICON: Record<string, AppIconName> = {
  new_bid: 'tag',
  bid_accepted: 'check',
  bid_rejected: 'close',
  bid_countered: 'refresh',
  bid_expiring: 'clock',
  listing_contact: 'chat',
  unknown: 'bell',
};

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
  onLongPress?: (notification: AppNotification) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
  onLongPress,
}) => {
  const unread = !notification.read;
  const accent = notificationAccent(notification.type);
  const icon = TYPE_ICON[notification.type] ?? 'bell';

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      onLongPress={onLongPress ? () => onLongPress(notification) : undefined}
      activeOpacity={0.75}
      className={`flex-row items-center px-3 py-2.5 ${
        unread ? 'bg-[#E7F3FF]' : 'bg-white'
      }`}>
      <View
        className="mr-3 h-12 w-12 items-center justify-center rounded-full"
        style={{backgroundColor: `${accent}22`}}>
        <AppIcon name={icon} size={20} color={accent} />
      </View>

      <View className="min-w-0 flex-1 pr-2">
        <Text
          className={`text-[15px] leading-5 text-brand-black ${
            unread ? 'font-bold' : 'font-medium'
          }`}
          numberOfLines={2}>
          {notificationTitle(notification.type)}
        </Text>
        <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal" numberOfLines={2}>
          {notificationBody(notification)}
        </Text>
        <Text
          className={`mt-1 text-[12px] font-semibold ${
            unread ? 'text-brand-blue' : 'text-brand-gray'
          }`}>
          {formatRelativeTime(notification.createdAt)}
        </Text>
      </View>

      {unread ? <View className="h-3 w-3 rounded-full bg-brand-blue" /> : null}
    </TouchableOpacity>
  );
};
