import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Listing} from '@shared/types';
import {listingImageUrl} from '@api/normalize';
import {formatListingPlace, formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {CategoryBadge} from '@shared/ui/CategoryBadge';
import {AppIcon} from '@shared/ui/AppIcon';
import {CachedImage} from '@shared/ui/CachedImage';
import {shadows} from '@shared/theme/shadows';
import {colors} from '@shared/theme/colors';

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
  const place = formatListingPlace(listing);

  return (
    <TouchableOpacity
      onPress={() => onPress(listing.id)}
      activeOpacity={0.8}
      className={`rounded-lg border border-slate-200 bg-white ${
        compact ? 'flex-1' : 'mb-3'
      }`}
      style={shadows.card}>
      <View className={`relative w-full ${compact ? 'h-32' : 'h-44'}`}>
        {thumbnailUrl ? (
          <CachedImage
            source={thumbnailUrl}
            className="h-full w-full rounded-none"
            contentFit="cover"
            recyclingKey={listing.id}
          />
        ) : (
          <View className="h-full w-full items-center justify-center bg-slate-200">
            <Text className="text-sm text-brand-gray">No photo</Text>
          </View>
        )}
        <View className="absolute left-2 top-2">
          <CategoryBadge category={listing.category} />
        </View>
      </View>

      <View className={compact ? 'px-2.5 py-2' : 'px-3.5 py-3'}>
        <Text
          className={`font-semibold text-brand-black ${
            compact ? 'text-[13px] leading-4' : 'text-[16px] leading-5'
          }`}
          numberOfLines={2}>
          {listing.title}
        </Text>

        {place ? (
          <View className="mt-1 flex-row items-center">
            <AppIcon name="pin" size={12} color={colors.brand.gray} />
            <Text className="ml-1 flex-1 text-sm text-brand-gray" numberOfLines={1}>
              {place}
            </Text>
          </View>
        ) : null}

        <Text
          className={`mt-1 font-bold text-brand-black ${
            compact ? 'text-[15px]' : 'text-[18px]'
          }`}>
          {formatPrice(listing.askingPrice, listing.currency)}
        </Text>

        {compact ? (
          <Text className="mt-0.5 text-[11px] text-brand-gray" numberOfLines={1}>
            {formatRelativeTime(listing.createdAt)}
          </Text>
        ) : (
          <View className="mt-1 flex-row items-center justify-between">
            <Text className="text-xs text-brand-charcoal">
              Min bid {formatPrice(listing.minBidPrice, listing.currency)}
            </Text>
            <Text className="text-xs text-brand-gray">
              {formatRelativeTime(listing.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};
