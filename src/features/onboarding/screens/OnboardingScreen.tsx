import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ViewToken,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useOnboardingStore} from '../onboardingStore';
import {Logo} from '@shared/ui/Logo';
import {Button} from '@shared/ui/Button';
import {DiscoverArt, NegotiateArt, TrustArt} from '../OnboardingArt';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

const SLIDES = [
  {
    id: 'discover',
    kicker: 'Explore',
    title: 'Pre-owned deals nearby',
    body: 'Browse second-hand listings across Cameroon — phones, furniture, fashion, and everyday finds.',
    Art: DiscoverArt,
  },
  {
    id: 'negotiate',
    kicker: 'Negotiate',
    title: 'Offer, counter, agree',
    body: 'Send an offer, get a counter, and lock the price when you both agree.',
    Art: NegotiateArt,
  },
  {
    id: 'trust',
    kicker: 'Trust',
    title: 'Meet safe. Chat private.',
    body: 'WhatsApp unlocks only after both sides accept. Always complete the handoff in public.',
    Art: TrustArt,
  },
] as const;

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useOnboardingStore(s => s.completeOnboarding);
  const listRef = useRef<FlatList<(typeof SLIDES)[number]>>(null);
  const [index, setIndex] = useState(0);
  const isLast = index === SLIDES.length - 1;

  const headerH = 48;
  const copyH = 118;
  const footerH = 108 + Math.max(insets.bottom, 12);
  const artHeight = Math.max(
    300,
    SCREEN_HEIGHT - insets.top - headerH - copyH - footerH,
  );

  const finish = () => {
    void completeOnboarding();
  };

  const goTo = (next: number) => {
    listRef.current?.scrollToIndex({index: next, animated: true});
    setIndex(next);
  };

  const onContinue = () => {
    if (isLast) {
      finish();
      return;
    }
    goTo(index + 1);
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) setIndex(next);
  };

  const onViewableItemsChanged = useRef(
    ({viewableItems}: {viewableItems: ViewToken[]}) => {
      const next = viewableItems[0]?.index;
      if (typeof next === 'number') setIndex(next);
    },
  ).current;

  return (
    <View
      className="flex-1 bg-white"
      style={{paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 12)}}>
      <View
        className="flex-row items-center justify-between px-6"
        style={{height: headerH}}>
        <View className="flex-row items-center gap-2">
          <Logo size={26} />
          <Text className="text-[16px] font-semibold tracking-tight text-brand-black">
            OfferBid
          </Text>
        </View>
        <TouchableOpacity
          onPress={finish}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel="Skip onboarding">
          <Text className="text-[15px] font-medium text-brand-gray">Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={listRef}
        style={{flex: 1}}
        data={SLIDES}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{viewAreaCoveragePercentThreshold: 60}}
        getItemLayout={(_, i) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * i,
          index: i,
        })}
        extraData={index}
        renderItem={({item, index: itemIndex}) => {
          const Art = item.Art;
          const active = itemIndex === index;
          return (
            <View style={{width: SCREEN_WIDTH}} className="flex-1">
              <View
                style={{height: artHeight}}
                className="items-center justify-end">
                <Art width={SCREEN_WIDTH} height={artHeight} active={active} />
              </View>
              <View className="px-7 pt-1">
                <Text className="mb-1.5 text-center text-[11px] font-semibold uppercase tracking-[1.8px] text-brand-blue">
                  {item.kicker}
                </Text>
                <Text className="mb-2 text-center text-[26px] font-bold leading-8 tracking-tight text-brand-black">
                  {item.title}
                </Text>
                <Text className="text-center text-[15px] leading-[22px] text-brand-charcoal">
                  {item.body}
                </Text>
              </View>
            </View>
          );
        }}
      />

      <View className="px-6 pt-3">
        <View className="mb-4 flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, i) => (
            <View
              key={slide.id}
              className={`h-1.5 rounded-full ${
                i === index ? 'w-7 bg-brand-blue' : 'w-1.5 bg-slate-200'
              }`}
            />
          ))}
        </View>
        <Button
          title={isLast ? 'Get started' : 'Continue'}
          onPress={onContinue}
          fullWidth
          size="lg"
          style={{minHeight: 52, borderRadius: 14}}
        />
      </View>
    </View>
  );
}
