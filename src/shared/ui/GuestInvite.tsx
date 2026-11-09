import React, {useEffect, useRef, useState} from 'react';
import {View, Text, TouchableOpacity, Animated} from 'react-native';
import {Logo} from './Logo';

interface GuestInviteProps {
  onPress: () => void;
  onDismiss?: () => void;
}

export function GuestInvite({onPress, onDismiss}: GuestInviteProps) {
  const enter = useRef(new Animated.Value(0)).current;
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    Animated.spring(enter, {
      toValue: 1,
      friction: 8,
      tension: 64,
      useNativeDriver: true,
    }).start();
  }, [enter]);

  const dismiss = () => {
    Animated.timing(enter, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        setHidden(true);
        onDismiss?.();
      }
    });
  };

  if (hidden) return null;

  return (
    <Animated.View
      className="mt-2"
      style={{
        opacity: enter,
        transform: [
          {
            translateY: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [-16, 0],
            }),
          },
          {
            scale: enter.interpolate({
              inputRange: [0, 1],
              outputRange: [0.96, 1],
            }),
          },
        ],
      }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        className="flex-row items-center gap-2 rounded-[18px] border border-[#C5DFF0] bg-[#EAF4FB] py-3 pl-2.5 pr-9"
        accessibilityRole="button"
        accessibilityLabel="Log in or sign up to bid on offers">
        <Logo size={40} />
        <View className="min-w-0 flex-1">
          <Text className="mb-0.5 text-base font-bold text-brand-black">
            Browse now. Bid after you join.
          </Text>
          <Text className="text-xs leading-[18px] text-brand-charcoal">
            Create a free account to place offers and chat when a deal is agreed.
          </Text>
        </View>
        <View className="rounded-full bg-brand-blue px-3 py-2">
          <Text className="text-[13px] font-bold text-white">Sign in</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={dismiss}
        className="absolute right-2 top-1.5 h-6 w-6 items-center justify-center"
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Dismiss">
        <Text className="text-xl font-medium leading-[22px] text-brand-gray">×</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
