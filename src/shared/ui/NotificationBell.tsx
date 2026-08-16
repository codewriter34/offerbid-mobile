import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {colors} from '@shared/theme/colors';

export function NotificationBell({
  unreadCount,
  onPress,
}: {
  unreadCount: number;
  onPress: () => void;
}) {
  const hasUnread = unreadCount > 0;
  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={styles.hit}
      accessibilityRole="button"
      accessibilityLabel={
        hasUnread ? `${unreadCount} unread notifications` : 'Notifications'
      }>
      <View style={styles.circle}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3.1c.72 0 1.3.58 1.3 1.3v.42c2.86.62 4.9 3.2 4.9 6.28v3.38l1.42 1.62c.3.34.06.86-.4.86H4.78c-.46 0-.7-.52-.4-.86L5.8 14.48V11.1c0-3.08 2.04-5.66 4.9-6.28V4.4c0-.72.58-1.3 1.3-1.3Z"
            fill={colors.brand.black}
          />
          <Path
            d="M9.55 18.35a2.55 2.55 0 0 0 4.9 0"
            stroke={colors.brand.black}
            strokeWidth={1.9}
            strokeLinecap="round"
          />
        </Svg>
      </View>
      {hasUnread ? (
        <View style={[styles.badge, badge.length > 1 && styles.badgeWide]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hit: {
    width: 40,
    height: 40,
  },
  circle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E6EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: '#E41E3F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeWide: {
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 13,
    includeFontPadding: false,
  },
});
