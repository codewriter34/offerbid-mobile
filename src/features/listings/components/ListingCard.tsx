import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {Listing} from '@shared/types';
import {listingImageUrl} from '@api/normalize';
import {colors} from '@shared/theme/colors';
import {typography} from '@shared/theme/typography';
import {spacing, borderRadius} from '@shared/theme/spacing';
import {formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {CategoryBadge} from '@shared/ui/CategoryBadge';

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
  compact?: boolean;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  onPress,
  compact = false,
}) => {
  const thumbnailUrl = listingImageUrl(listing);

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact]}
      onPress={() => onPress(listing.id)}
      activeOpacity={0.7}>
      <View style={[styles.imageWrapper, compact && styles.imageWrapperCompact]}>
        {thumbnailUrl ? (
          <Image source={{uri: thumbnailUrl}} style={styles.image} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.badgeOverlay}>
          <CategoryBadge category={listing.category} />
        </View>
      </View>

      <View style={[styles.content, compact && styles.contentCompact]}>
        <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={[styles.price, compact && styles.priceCompact]}>
          {formatPrice(listing.askingPrice, listing.currency)}
        </Text>

        {compact ? (
          <Text style={styles.time} numberOfLines={1}>
            {formatRelativeTime(listing.createdAt)}
          </Text>
        ) : (
          <View style={styles.footer}>
            <Text style={styles.minBid}>
              Min bid: {formatPrice(listing.minBidPrice, listing.currency)}
            </Text>
            <Text style={styles.time}>
              {formatRelativeTime(listing.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    elevation: 2,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  containerCompact: {
    flex: 1,
    marginBottom: 0,
  },
  imageWrapper: {
    height: 180,
    position: 'relative',
  },
  imageWrapperCompact: {
    height: 128,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.bodySmall,
    color: colors.text.light,
  },
  badgeOverlay: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
  },
  content: {
    padding: spacing.md,
  },
  contentCompact: {
    padding: spacing.sm,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  titleCompact: {
    fontSize: 14,
    lineHeight: 18,
  },
  price: {
    ...typography.price,
    color: colors.gradientStart,
    marginBottom: spacing.sm,
  },
  priceCompact: {
    fontSize: 15,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minBid: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  time: {
    ...typography.caption,
    color: colors.text.light,
  },
});
