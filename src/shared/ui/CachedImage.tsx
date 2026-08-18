import React from 'react';
import {Image, ImageProps} from 'expo-image';
import {cssInterop} from 'nativewind';

cssInterop(Image, {className: 'style'});

export function CachedImage({
  cachePolicy = 'memory-disk',
  ...props
}: ImageProps) {
  return <Image cachePolicy={cachePolicy} {...props} />;
}
