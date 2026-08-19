import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {AppIcon} from '@shared/ui/AppIcon';
import {
  SuccessBurstKind,
  useSuccessBurstStore,
} from '@shared/ui/successBurstStore';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');
const COLORS = ['#2070C8', '#0F172A', '#F59E0B', '#10B981', '#F43F5E', '#38BDF8'];

function pieceCount(kind: SuccessBurstKind) {
  return kind === 'confetti' ? 22 : 10;
}

function ConfettiPiece({
  index,
  kind,
  active,
}: {
  index: number;
  kind: SuccessBurstKind;
  active: boolean;
}) {
  const y = useRef(new Animated.Value(-24)).current;
  const xDrift = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const startX = useMemo(
    () => (index * 47 + 18) % Math.max(SCREEN_W - 16, 1),
    [index],
  );
  const color = COLORS[index % COLORS.length];
  const size = kind === 'confetti' ? 7 + (index % 5) : 6;
  const round = index % 3 === 0;

  useEffect(() => {
    if (!active) {
      y.setValue(-24);
      xDrift.setValue(0);
      rotate.setValue(0);
      opacity.setValue(0);
      return;
    }
    const drift = (index % 2 === 0 ? 1 : -1) * (18 + (index % 7) * 6);
    const fallMs = kind === 'confetti' ? 1700 : 1200;
    Animated.parallel([
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 140,
          delay: index * 18,
          useNativeDriver: true,
        }),
        Animated.delay(kind === 'confetti' ? 900 : 500),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(y, {
        toValue: SCREEN_H * 0.72,
        duration: fallMs,
        delay: index * 18,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(xDrift, {
        toValue: drift,
        duration: fallMs,
        delay: index * 18,
        useNativeDriver: true,
      }),
      Animated.timing(rotate, {
        toValue: 1,
        duration: fallMs,
        delay: index * 18,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, index, kind, opacity, rotate, xDrift, y]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${180 + index * 40}deg`],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: startX,
        width: round ? size : size + 2,
        height: round ? size : size * 1.6,
        borderRadius: round ? size : 2,
        backgroundColor: color,
        opacity,
        transform: [{translateY: y}, {translateX: xDrift}, {rotate: spin}],
      }}
    />
  );
}

const hostStack: symbol[] = [];

export function SuccessBurstHost() {
  const hostId = useRef(Symbol('success-burst-host')).current;
  const [, bump] = useState(0);
  const visible = useSuccessBurstStore(s => s.visible);
  const kind = useSuccessBurstStore(s => s.kind);
  const title = useSuccessBurstStore(s => s.title);
  const message = useSuccessBurstStore(s => s.message);
  const actionLabel = useSuccessBurstStore(s => s.actionLabel);
  const onAction = useSuccessBurstStore(s => s.onAction);
  const hide = useSuccessBurstStore(s => s.hide);
  const scale = useRef(new Animated.Value(0.84)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    hostStack.push(hostId);
    bump(n => n + 1);
    return () => {
      const index = hostStack.lastIndexOf(hostId);
      if (index >= 0) hostStack.splice(index, 1);
    };
  }, [hostId]);

  useEffect(() => {
    if (!visible) {
      scale.setValue(0.84);
      cardOpacity.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, cardOpacity, scale]);

  const finish = () => {
    hide();
    onAction?.();
  };

  const pieces = useMemo(
    () => Array.from({length: pieceCount(kind)}, (_, i) => i),
    [kind],
  );

  if (!visible || hostStack[hostStack.length - 1] !== hostId) return null;

  return (
    <View style={styles.layer} pointerEvents="auto">
      {pieces.map(index => (
        <ConfettiPiece key={`${kind}-${index}`} index={index} kind={kind} active={visible} />
      ))}
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <Animated.View
          className="w-full max-w-[340px] items-center rounded-3xl bg-white px-6 py-7"
          style={{opacity: cardOpacity, transform: [{scale}]}}>
          <View
            className="mb-4 h-16 w-16 items-center justify-center rounded-full"
            style={{backgroundColor: kind === 'confetti' ? '#DBEAFE' : '#D1FAE5'}}>
            <AppIcon
              name="check"
              size={30}
              color={kind === 'confetti' ? '#2070C8' : '#047857'}
            />
          </View>
          <Text className="text-center text-[22px] font-bold text-brand-black">
            {title}
          </Text>
          <Text className="mt-2 text-center text-[14px] leading-5 text-brand-charcoal">
            {message}
          </Text>
          <Pressable
            onPress={finish}
            className="mt-6 w-full items-center rounded-xl bg-brand-blue py-3.5"
            accessibilityRole="button">
            <Text className="text-[15px] font-semibold text-white">{actionLabel}</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
});
