import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Text,
  View,
  ViewStyle,
  StyleProp,
} from 'react-native';
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
  onLoadStart,
  onLoad,
  onError,
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
      onLoadStart={onLoadStart}
      onLoad={onLoad}
      onError={onError}
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    uri ? 'loading' : 'idle',
  );

  useEffect(() => {
    setStatus(uri ? 'loading' : 'idle');
  }, [uri, recyclingKey]);

  if (!uri || status === 'error') {
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
      {status === 'loading' ? (
        <View className="absolute inset-0 z-10 items-center justify-center bg-slate-100">
          <ActivityIndicator size="small" color={colors.brand.blue} />
        </View>
      ) : null}
      <CachedImage
        key={recyclingKey ?? uri}
        source={uri}
        recyclingKey={recyclingKey}
        className="h-full w-full"
        contentFit="cover"
        accessibilityIgnoresInvertColors
        onLoadStart={() => setStatus('loading')}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
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
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>(
    uri ? 'loading' : 'idle',
  );

  useEffect(() => {
    setStatus(uri ? 'loading' : 'idle');
  }, [uri]);

  if (!uri || status === 'error') {
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
    <View
      className={`overflow-hidden rounded-full bg-slate-200 ${className ?? ''}`}
      style={{width: size, height: size}}>
      {status === 'loading' ? (
        <View className="absolute inset-0 z-10 items-center justify-center">
          <ActivityIndicator size="small" color={colors.brand.blue} />
        </View>
      ) : null}
      <CachedImage
        key={uri}
        source={uri}
        recyclingKey={uri}
        className="h-full w-full rounded-full"
        style={{width: size, height: size}}
        contentFit="cover"
        accessibilityLabel={name ?? 'Profile photo'}
        onLoadStart={() => setStatus('loading')}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
    </View>
  );
}
