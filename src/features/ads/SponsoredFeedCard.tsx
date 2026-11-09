import React from 'react';
import {Alert, Text, TouchableOpacity, View} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import {SponsoredAd} from '@shared/types';
import {MediaThumb} from '@shared/ui/CachedImage';
import {shadows} from '@shared/theme/shadows';

async function openAdDestination(url: string) {
  const destination = url.trim();
  if (!/^https?:\/\//i.test(destination)) {
    Alert.alert('Unable to open link');
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(destination);
  } catch {
    Alert.alert('Unable to open link');
  }
}

export function SponsoredFeedCard({ad}: {ad: SponsoredAd}) {
  const cta = ad.ctaLabel.trim() || 'Learn more';

  return (
    <TouchableOpacity
      onPress={() => void openAdDestination(ad.destinationUrl)}
      activeOpacity={0.9}
      className="mb-3 overflow-hidden rounded-lg border border-slate-200 bg-white"
      style={shadows.card}
      accessibilityRole="link"
      accessibilityLabel={`Sponsored. ${ad.title}. ${cta}`}>
      <Text className="px-3.5 pt-3 text-[11px] font-bold uppercase tracking-wide text-brand-gray">
        Sponsored
      </Text>
      {ad.imageUrl ? (
        <View className="mt-2 h-40 w-full">
          <MediaThumb uri={ad.imageUrl} recyclingKey={`ad-${ad.id}`} className="h-40 w-full" iconSize={28} />
        </View>
      ) : null}
      <View className="px-3.5 py-3">
        {ad.advertiserName ? (
          <Text className="text-xs font-semibold text-brand-gray" numberOfLines={1}>
            {ad.advertiserName}
          </Text>
        ) : null}
        <Text className="text-[16px] font-semibold leading-5 text-brand-black" numberOfLines={2}>
          {ad.title}
        </Text>
        {ad.body ? (
          <Text className="mt-1 text-sm leading-5 text-brand-charcoal" numberOfLines={3}>
            {ad.body}
          </Text>
        ) : null}
        <View className="mt-3 self-start rounded-full bg-brand-blue px-3 py-2">
          <Text className="text-[13px] font-bold text-white">{cta}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
