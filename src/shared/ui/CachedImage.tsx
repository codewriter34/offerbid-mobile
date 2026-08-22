import React from 'react';
import {Text, View, ViewStyle, StyleProp} from 'react-native';
import {Image, ImageProps} from 'expo-image';
import {cssInterop} from 'nativewind';
import {AppIcon} from './AppIcon';
import {colors} from '@shared/theme/colors';

cssInterop(Image, {className: 'style'});

function asImageSource(source: ImageProps['source']): ImageProps['source'] | null {
  if (source == null) return null;
  if (typeof source === 'string') {
    const uri = source.trim();
    return uri ? {uri} : null;
  }
  if (Array.isArray(source)) {
    return source.length > 0 ? source : null;
  }
  if (typeof source === 'object' && 'uri' in source) {
    const uri = source.uri;
    if (typeof uri !== 'string' || !uri.trim()) return null;
    return {...source, uri: uri.trim()};
  }
  return source;
}

export function CachedImage({
  cachePolicy = 'memory-disk',
  transition = 180,
  contentFit = 'cover',
  source,
  ...props
}: ImageProps) {
  const resolved = asImageSource(source);
  if (!resolved) return null;
  return (
    <Image
      cachePolicy={cachePolicy}
      transition={transition}
      contentFit={contentFit}
      source={resolved}
      {...props}
    />
  );
}

export function MediaThumb({
  uri,
  recyclingKey,
  className,
  style,
  iconSize = 18,
}: {
  uri?: string | null;
  recyclingKey?: string;
  className?: string;
  style?: StyleProp<ViewStyle>;
  iconSize?: number;
}) {
  if (!uri) {
    return (
      <View
        className={`items-center justify-center bg-slate-100 ${className ?? ''}`}
        style={style}>
        <AppIcon name="image" size={iconSize} color={colors.brand.gray} />
      </View>
    );
  }

  return (
    <View className={`overflow-hidden bg-slate-100 ${className ?? ''}`} style={style}>
      <CachedImage
        source={uri}
        recyclingKey={recyclingKey}
        className="h-full w-full"
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export function AvatarImage({
  uri,
  name,
  size = 48,
  className,
}: {
  uri?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const initial = (name?.trim()?.charAt(0) ?? '?').toUpperCase();
  if (!uri) {
    return (
      <View
        className={`items-center justify-center rounded-full bg-brand-black ${className ?? ''}`}
        style={{width: size, height: size}}>
        <Text
          className="font-bold text-white"
          style={{fontSize: Math.round(size * 0.38)}}>
          {initial}
        </Text>
      </View>
    );
  }
  return (
    <CachedImage
      source={uri}
      recyclingKey={uri}
      className={`rounded-full ${className ?? ''}`}
      style={{width: size, height: size}}
      contentFit="cover"
      accessibilityLabel={name ?? 'Profile photo'}
    />
  );
}
