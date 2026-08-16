import React, {useEffect, useRef, useState} from 'react';
import {View, Text, StyleSheet, Animated, Easing} from 'react-native';
import Svg, {Circle, Ellipse, Path, Rect, G} from 'react-native-svg';

const BLUE = '#2070C8';
const BLUE_DEEP = '#1D4ED8';
const BLUE_SOFT = '#DBEAFE';
const NAVY = '#0F172A';
const GREEN = '#10B981';
const SKIN_A = '#F2C7A4';
const SKIN_B = '#C48A5A';
const SKIN_C = '#E8B48A';
const LIP = '#C45C4A';

export interface ArtProps {
  width: number;
  height: number;
  active?: boolean;
}

function Face({
  cx,
  cy,
  skin,
  hair,
  hairPath,
}: {
  cx: number;
  cy: number;
  skin: string;
  hair: string;
  hairPath: string;
}) {
  return (
    <G>
      <Circle cx={cx} cy={cy} r={30} fill={skin} />
      <Path d={hairPath} fill={hair} />
      <Ellipse cx={cx - 10} cy={cy + 1} rx={3.6} ry={4.4} fill={NAVY} />
      <Ellipse cx={cx + 10} cy={cy + 1} rx={3.6} ry={4.4} fill={NAVY} />
      <Circle cx={cx - 8.8} cy={cy - 0.6} r={1.3} fill="#FFFFFF" />
      <Circle cx={cx + 11.2} cy={cy - 0.6} r={1.3} fill="#FFFFFF" />
      <Path
        d={`M${cx - 16} ${cy - 11}q7 -4 14 0`}
        stroke={hair}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${cx + 2} ${cy - 11}q7 -4 14 0`}
        stroke={hair}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d={`M${cx - 9} ${cy + 13}q9 8 18 0`}
        stroke={LIP}
        strokeWidth={2.2}
        strokeLinecap="round"
        fill="none"
      />
    </G>
  );
}

function Person({
  x,
  y,
  skin,
  hair,
  hairPath,
  shirt,
  pants,
  flip,
  pose = 'idle',
}: {
  x: number;
  y: number;
  skin: string;
  hair: string;
  hairPath: string;
  shirt: string;
  pants: string;
  flip?: boolean;
  pose?: 'idle' | 'phone' | 'reach';
}) {
  return (
    <G transform={`translate(${x} ${y})${flip ? ' scale(-1 1) translate(-120 0)' : ''}`}>
      <Rect x={34} y={148} width={20} height={72} rx={10} fill={pants} />
      <Rect x={62} y={148} width={20} height={72} rx={10} fill={pants} />
      <Ellipse cx={44} cy={222} rx={15} ry={8} fill={NAVY} />
      <Ellipse cx={72} cy={222} rx={15} ry={8} fill={NAVY} />
      <Path
        d="M28 86c0-10 12-16 30-16s30 6 30 16v58c0 10-12 16-30 16s-30-6-30-16V86Z"
        fill={shirt}
      />
      <Rect x={50} y={68} width={16} height={18} rx={6} fill={skin} />
      {pose === 'phone' ? (
        <G>
          <Rect x={8} y={92} width={18} height={58} rx={9} fill={shirt} />
          <Circle cx={17} cy={154} r={10} fill={skin} />
          <G transform="rotate(-18 98 118)">
            <Rect x={82} y={88} width={18} height={52} rx={9} fill={shirt} />
            <Circle cx={91} cy={144} r={10} fill={skin} />
            <Rect x={84} y={118} width={26} height={42} rx={6} fill={NAVY} />
            <Rect x={88} y={124} width={18} height={30} rx={3} fill="#E0EAFF" />
          </G>
        </G>
      ) : pose === 'reach' ? (
        <G>
          <Rect x={8} y={94} width={18} height={54} rx={9} fill={shirt} />
          <Circle cx={17} cy={152} r={10} fill={skin} />
          <Rect x={78} y={108} width={62} height={16} rx={8} fill={shirt} />
          <Circle cx={144} cy={116} r={11} fill={skin} />
        </G>
      ) : (
        <G>
          <Rect x={8} y={92} width={18} height={58} rx={9} fill={shirt} />
          <Circle cx={17} cy={154} r={10} fill={skin} />
          <Rect x={90} y={92} width={18} height={58} rx={9} fill={shirt} />
          <Circle cx={99} cy={154} r={10} fill={skin} />
        </G>
      )}
      <Face cx={58} cy={40} skin={skin} hair={hair} hairPath={hairPath} />
    </G>
  );
}

const HAIR_SHORT = 'M28 36C30 12 86 12 88 36 80 22 36 22 28 36Z';
const HAIR_CURLY =
  'M24 38c-4-22 16-34 34-34 20 0 40 12 36 34-8-14-22-18-36-10-10-4-22-2-34 10Z';
const HAIR_SIDE =
  'M28 36C32 12 86 10 90 36 82 22 40 22 28 36Zm54 2c4 14 2 28-4 36-2-12-2-24-2-36Z';

function useLoopValue(active: boolean, duration: number) {
  const value = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!active) {
      value.stopAnimation();
      value.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [active, duration, value]);
  return value;
}

function DealChip({
  kicker,
  value,
  tone,
  from,
}: {
  kicker: string;
  value: string;
  tone: 'blue' | 'amber' | 'green';
  from: 'left' | 'right' | 'center';
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const shift = useRef(new Animated.Value(from === 'center' ? 0.4 : from === 'left' ? -1 : 1)).current;
  const bg =
    tone === 'blue' ? '#DBEAFE' : tone === 'amber' ? '#FEF3C7' : '#D1FAE5';
  const fg =
    tone === 'blue' ? BLUE : tone === 'amber' ? '#D97706' : '#047857';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.spring(shift, {
        toValue: 0,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, shift]);

  return (
    <Animated.View
      style={[
        styles.chip,
        {
          backgroundColor: bg,
          opacity,
          transform: [
            {
              translateX: shift.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-28, 0, 28],
              }),
            },
            {
              scale: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: [from === 'center' ? 0.86 : 1, 1],
              }),
            },
          ],
        },
      ]}>
      <Text style={[styles.chipKicker, {color: fg}]}>{kicker}</Text>
      <Text style={[styles.chipValue, {color: fg}]}>{value}</Text>
    </Animated.View>
  );
}

export function DiscoverArt({width, height, active = true}: ArtProps) {
  const float = useLoopValue(active, 2000);
  const pulse = useLoopValue(active, 900);

  return (
    <View style={{width, height}}>
      <Animated.View
        style={{
          width,
          height,
          transform: [
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -8],
              }),
            },
          ],
        }}>
        <Svg width={width} height={height} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <Circle cx="200" cy="200" r="188" fill={BLUE} fillOpacity="0.08" />
          <Circle cx="200" cy="200" r="188" stroke={BLUE} strokeOpacity="0.12" strokeWidth="2" fill="none" />
          <Rect x="228" y="96" width="128" height="84" rx="16" fill="#FFFFFF" />
          <Rect x="240" y="110" width="42" height="34" rx="8" fill={BLUE_SOFT} />
          <Rect x="290" y="114" width="50" height="8" rx="4" fill={NAVY} fillOpacity="0.16" />
          <Rect x="290" y="130" width="32" height="8" rx="4" fill={BLUE} />
          <Rect x="240" y="154" width="84" height="8" rx="4" fill={NAVY} fillOpacity="0.1" />
          <Rect x="244" y="196" width="112" height="70" rx="14" fill="#FFFFFF" />
          <Rect x="256" y="210" width="34" height="28" rx="7" fill="#BFDBFE" />
          <Rect x="298" y="214" width="42" height="7" rx="3.5" fill={NAVY} fillOpacity="0.16" />
          <Rect x="298" y="228" width="26" height="7" rx="3.5" fill={GREEN} />
          <Person
            x={46}
            y={86}
            skin={SKIN_A}
            hair={NAVY}
            hairPath={HAIR_CURLY}
            shirt={BLUE}
            pants={BLUE_DEEP}
            pose="phone"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.pinWrap,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.12],
                }),
              },
            ],
          },
        ]}>
        <Svg width={36} height={44} viewBox="0 0 32 40">
          <Path
            d="M16 0c0 14-16 26-16 26S-16 14-16 0a16 16 0 1 1 32 0Z"
            fill={BLUE}
            transform="translate(16 0)"
          />
          <Circle cx="16" cy="14" r="5.5" fill="#FFFFFF" />
        </Svg>
      </Animated.View>
    </View>
  );
}

export function NegotiateArt({width, height, active = true}: ArtProps) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!active) {
      setPhase(0);
      return;
    }
    let cancelled = false;
    const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
    (async () => {
      while (!cancelled) {
        setPhase(0);
        await wait(200);
        if (cancelled) break;
        setPhase(1);
        await wait(1400);
        if (cancelled) break;
        setPhase(2);
        await wait(1400);
        if (cancelled) break;
        setPhase(3);
        await wait(1800);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [active]);

  return (
    <View style={{width, height}}>
      <Svg width={width} height={height} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
        <Circle cx="200" cy="200" r="188" fill={BLUE} fillOpacity="0.08" />
        <Circle cx="200" cy="200" r="188" stroke={BLUE} strokeOpacity="0.12" strokeWidth="2" fill="none" />
        <Person
          x={8}
          y={100}
          skin={SKIN_B}
          hair="#1C1917"
          hairPath={HAIR_SHORT}
          shirt={NAVY}
          pants="#334155"
          pose="idle"
        />
        <Person
          x={268}
          y={100}
          skin={SKIN_C}
          hair="#78350F"
          hairPath={HAIR_SIDE}
          shirt={BLUE}
          pants={BLUE_DEEP}
          flip
          pose="idle"
        />
      </Svg>
      <View style={styles.dealStack} pointerEvents="none">
        {phase >= 1 ? (
          <DealChip kicker="Offer" value="$18" tone="blue" from="left" />
        ) : (
          <View style={styles.chipSpacer} />
        )}
        {phase >= 2 ? <Text style={styles.dealArrow}>↓</Text> : <View style={styles.arrowSpacer} />}
        {phase >= 2 ? (
          <DealChip kicker="Counter" value="$20" tone="amber" from="right" />
        ) : (
          <View style={styles.chipSpacer} />
        )}
        {phase >= 3 ? <Text style={styles.dealArrow}>↓</Text> : <View style={styles.arrowSpacer} />}
        {phase >= 3 ? (
          <DealChip kicker="Agreed" value="$19" tone="green" from="center" />
        ) : (
          <View style={styles.chipSpacer} />
        )}
      </View>
    </View>
  );
}

export function TrustArt({width, height, active = true}: ArtProps) {
  const float = useLoopValue(active, 2200);
  const pulse = useLoopValue(active, 900);

  return (
    <View style={{width, height}}>
      <Animated.View
        style={{
          width,
          height,
          transform: [
            {
              translateY: float.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -6],
              }),
            },
          ],
        }}>
        <Svg width={width} height={height} viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <Circle cx="200" cy="200" r="188" fill={GREEN} fillOpacity="0.1" />
          <Circle cx="200" cy="200" r="188" stroke={GREEN} strokeOpacity="0.18" strokeWidth="2" fill="none" />
          <Path
            d="M200 78 252 100v40c0 38-22 62-52 74-30-12-52-36-52-74v-40l52-22Z"
            fill={GREEN}
            fillOpacity="0.35"
          />
          <Path
            d="M184 128 196 140l24-30"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Person
            x={28}
            y={100}
            skin={SKIN_A}
            hair={NAVY}
            hairPath={HAIR_CURLY}
            shirt={BLUE}
            pants={BLUE_DEEP}
            pose="reach"
          />
          <Person
            x={196}
            y={100}
            skin={SKIN_B}
            hair="#292524"
            hairPath={HAIR_SHORT}
            shirt={NAVY}
            pants="#334155"
            flip
            pose="reach"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.chatWrap,
          {
            transform: [
              {
                scale: pulse.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.1],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.chatBubble}>
          <View style={styles.dot} />
          <View style={[styles.dot, {opacity: 0.7}]} />
          <View style={[styles.dot, {opacity: 0.4}]} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  pinWrap: {
    position: 'absolute',
    top: '14%',
    right: '16%',
  },
  dealStack: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 12,
    gap: 6,
  },
  chip: {
    minWidth: 118,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
  },
  chipKicker: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  chipValue: {
    marginTop: 2,
    fontSize: 22,
    fontWeight: '800',
  },
  chipSpacer: {height: 48, width: 118},
  dealArrow: {
    fontSize: 16,
    color: '#94A3B8',
    fontWeight: '700',
  },
  arrowSpacer: {height: 20},
  chatWrap: {
    position: 'absolute',
    top: '16%',
    right: '12%',
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: GREEN,
  },
});
