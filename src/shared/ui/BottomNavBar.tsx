import React, {useEffect, useState} from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {MainTabParamList} from '@app/navigation/types';
import {useAuthStore} from '@features/auth/authStore';
import {useBidStore} from '@features/bids/bidStore';
import {colors} from '@shared/theme/colors';
import {layout} from '@shared/theme/spacing';
import {shadows} from '@shared/theme/shadows';
import {NavIcon, NavIconName} from './NavIcon';

type TabKey = keyof MainTabParamList;

const TABS: Array<{
  tab: TabKey;
  label: string;
  icon: NavIconName;
}> = [
  {tab: 'Explore', label: 'Explore', icon: 'explore'},
  {tab: 'MyBids', label: 'My Offers', icon: 'bids'},
  {tab: 'Selling', label: 'Selling', icon: 'selling'},
  {tab: 'Profile', label: 'Profile', icon: 'profile'},
];

export function BottomNavBar({state, navigation, insets}: BottomTabBarProps) {
  const user = useAuthStore(s => s.user);
  const counteredCount = useBidStore(
    s => s.myBids.filter(b => String(b.status).toUpperCase() === 'COUNTERED').length,
  );
  const pendingIncoming = useBidStore(
    s => s.incomingBids.filter(b => String(b.status).toUpperCase() === 'PENDING').length,
  );
  const navActive = state.routes[state.index]?.name as TabKey;
  const [pressedTab, setPressedTab] = useState<TabKey | null>(null);
  const active = pressedTab ?? navActive;

  useEffect(() => {
    if (pressedTab && navActive === pressedTab) {
      setPressedTab(null);
    }
  }, [navActive, pressedTab]);

  const goAuth = () => navigation.navigate('Auth', {screen: 'Login'});

  const goTab = (tab: TabKey) => {
    if (tab !== 'Explore' && !user) {
      goAuth();
      return;
    }
    setPressedTab(tab);
    navigation.navigate(tab);
  };

  const onSell = () => {
    if (!user) {
      goAuth();
      return;
    }
    if (!user.profileComplete) {
      navigation.navigate('HubSelect');
      return;
    }
    navigation.navigate('CreateListing');
  };

  return (
    <View
      className="border-t border-slate-200 bg-white"
      style={{paddingBottom: Math.max(insets.bottom, 8), ...shadows.nav}}>
      <View className="flex-row items-end px-1" style={{height: layout.navBarHeight}}>
        <NavItem
          label={TABS[0].label}
          icon={TABS[0].icon}
          active={active === 'Explore'}
          onPress={() => goTab('Explore')}
        />
        <NavItem
          label={TABS[1].label}
          icon={TABS[1].icon}
          active={active === 'MyBids'}
          badge={counteredCount}
          onPress={() => goTab('MyBids')}
        />
        <View className="w-[72px] items-center justify-end pb-1">
          <TouchableOpacity
            onPress={onSell}
            activeOpacity={0.85}
            className="-mt-6 items-center justify-center rounded-full bg-brand-blue"
            style={{
              width: layout.sellFabSize,
              height: layout.sellFabSize,
              ...shadows.fab,
            }}
            accessibilityRole="button"
            accessibilityLabel="Sell">
            <NavIcon name="plus" size={28} color={colors.white} />
          </TouchableOpacity>
          <Text className="mt-0.5 text-[11px] font-semibold text-brand-gray">Sell</Text>
          <View className="mt-1 h-1.5 w-1.5" />
        </View>
        <NavItem
          label={TABS[2].label}
          icon={TABS[2].icon}
          active={active === 'Selling'}
          badge={pendingIncoming}
          onPress={() => goTab('Selling')}
        />
        <NavItem
          label={TABS[3].label}
          icon={TABS[3].icon}
          active={active === 'Profile'}
          onPress={() => goTab('Profile')}
        />
      </View>
    </View>
  );
}

function NavItem({
  label,
  icon,
  active,
  badge,
  onPress,
}: {
  label: string;
  icon: NavIconName;
  active: boolean;
  badge?: number;
  onPress: () => void;
}) {
  const color = active ? colors.nav.active : colors.nav.inactive;

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 items-center justify-end pb-1"
      accessibilityRole="button"
      accessibilityState={{selected: active}}>
      <View className="h-9 w-9 items-center justify-center">
        <View
          className="absolute h-9 w-9 rounded-full bg-[#DBEAFE]"
          style={{opacity: active ? 1 : 0}}
        />
        <NavIcon name={icon} size={22} color={color} filled={active} />
        {!!badge && badge > 0 && (
          <View className="absolute -right-1.5 -top-0.5 min-w-[16px] items-center rounded-full bg-brand-danger px-1">
            <Text className="text-[10px] font-bold text-white">
              {badge > 9 ? '9+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text
        className={`mt-0.5 text-[11px] font-semibold ${
          active ? 'text-brand-blue' : 'text-brand-gray'
        }`}>
        {label}
      </Text>
      <View
        className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-blue"
        style={{opacity: active ? 1 : 0}}
      />
    </TouchableOpacity>
  );
}
