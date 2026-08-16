import React, {useEffect, useRef} from 'react';
import {Text, TouchableOpacity, Animated} from 'react-native';

export function FilterChip({
  label,
  count,
  color = '#2070C8',
  active,
  onPress,
}: {
  label: string;
  count?: number;
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.97)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: active ? 1 : 0.97,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [active, scale]);

  return (
    <Animated.View style={{transform: [{scale}]}}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        className="rounded-full border px-3.5 py-2"
        style={{
          backgroundColor: active ? color : '#FFFFFF',
          borderColor: active ? color : '#E2E8F0',
        }}>
        <Text
          className="text-[13px] font-semibold"
          style={{color: active ? '#FFFFFF' : '#0F172A'}}>
          {label}
          {count != null && count > 0 ? ` (${count})` : ''}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
