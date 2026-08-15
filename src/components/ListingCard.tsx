import React from 'react';
import {View, Text, Image, TouchableOpacity, StyleSheet} from 'react-native';
import {Listing} from '../types';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';
import {formatPrice, formatRelativeTime} from '../utils/formatters';
import {CategoryBadge} from './CategoryBadge';

interface ListingCardProps {
  listing: Listing;
  onPress: (id: string) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({listing, onPress}) => {
  const thumbnailUrl = listing.images?.[0]?.cloudinary_url;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(listing.id)}
      activeOpacity={0.7}>
      <View style={styles.imageWrapper}>
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

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {listing.title}
        </Text>

        <Text style={styles.price}>
          {formatPrice(listing.starting_price)}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.minBid}>
            Min bid: {formatPrice(listing.min_bid)}
          </Text>
          <Text style={styles.time}>
            {formatRelativeTime(listing.created_at)}
          </Text>
        </View>
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
  imageWrapper: {
    height: 180,
    position: 'relative',
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
  title: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  price: {
    ...typography.price,
    color: colors.gradientStart,
    marginBottom: spacing.sm,
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
