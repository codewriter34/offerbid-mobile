import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {ConversationDto} from '../types';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';
import {formatRelativeTime, formatPrice} from '../utils/formatters';

interface ConversationListItemProps {
  conversation: ConversationDto;
  onPress: (conversation: ConversationDto) => void;
}

export const ConversationListItem: React.FC<ConversationListItemProps> = ({
  conversation,
  onPress,
}) => {
  const {listing, peer, unreadCount, lastMessageAt} = conversation;
  const hasUnread = unreadCount > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(conversation)}
      activeOpacity={0.7}
      style={[styles.container, hasUnread && styles.unread]}>
      {listing.image ? (
        <Image source={{uri: listing.image}} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarFallbackText}>
            {peer.fullName?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.peerName} numberOfLines={1}>
            {peer.fullName}
            {peer.isVerified ? ' ✓' : ''}
          </Text>
          {lastMessageAt && (
            <Text style={styles.time}>{formatRelativeTime(lastMessageAt)}</Text>
          )}
        </View>
        <Text style={styles.listingTitle} numberOfLines={1}>
          {listing.title} · {formatPrice(listing.askingPrice, listing.currency)}
        </Text>
      </View>

      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
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
  avatar: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    ...typography.h3,
    color: colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  peerName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  time: {
    ...typography.caption,
    color: colors.text.light,
  },
  listingTitle: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: 2,
  },
  badge: {
    marginLeft: spacing.sm,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '700',
  },
});
