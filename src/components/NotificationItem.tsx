import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {AppNotification, NotificationType} from '../types';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';
import {formatRelativeTime} from '../utils/formatters';

interface NotificationItemProps {
  notification: AppNotification;
  onPress: (notification: AppNotification) => void;
}

const NOTIFICATION_CONFIG: Record<
  NotificationType,
  {icon: string; label: string; color: string}
> = {
  new_bid: {icon: '💰', label: 'New bid received', color: colors.primary},
  bid_accepted: {icon: '✅', label: 'Bid accepted', color: colors.success},
  bid_rejected: {icon: '❌', label: 'Bid rejected', color: colors.error},
  bid_countered: {icon: '🔄', label: 'Counter offer', color: colors.gradientStart},
  bid_expiring: {icon: '⏰', label: 'Bid expiring soon', color: colors.warning},
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onPress,
}) => {
  const config = NOTIFICATION_CONFIG[notification.type];
  const payload = notification.payload as {
    listing_title?: string;
    amount?: number;
    message?: string;
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
      style={[
        styles.container,
        !notification.read && styles.unread,
      ]}>
      <View style={[styles.iconCircle, {backgroundColor: config.color + '20'}]}>
        <Text style={styles.icon}>{config.icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>{config.label}</Text>
        {payload.listing_title && (
          <Text style={styles.detail} numberOfLines={1}>
            {payload.listing_title}
            {payload.amount ? ` — ${payload.amount}` : ''}
          </Text>
        )}
        {payload.message && (
          <Text style={styles.detail} numberOfLines={1}>
            {payload.message}
          </Text>
        )}
        <Text style={styles.time}>
          {formatRelativeTime(notification.created_at)}
        </Text>
      </View>

      {!notification.read && <View style={styles.dot} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: '#FFFDE7',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  label: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  detail: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  time: {
    ...typography.caption,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
