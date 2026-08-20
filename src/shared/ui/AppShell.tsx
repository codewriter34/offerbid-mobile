import React from 'react';
import {View, Text} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BottomNavBar} from './BottomNavBar';
import {colors} from '@shared/theme/colors';
import {layout} from '@shared/theme/spacing';

interface AppShellProps {
  children: React.ReactNode;
  safetyRibbon?: boolean;
  showNav?: boolean;
}

export function AppShell({
  children,
  safetyRibbon = false,
  showNav = true,
}: AppShellProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-brand-white"
      style={{paddingTop: insets.top + layout.screenTopExtra}}>
      <View className="flex-1">{children}</View>
      {safetyRibbon ? (
        <View
          className="px-4 py-2"
          style={{backgroundColor: colors.ribbon.background}}>
          <Text className="text-center text-[11px] font-semibold leading-4 text-white">
            Always verify items before payment. Complete physical transactions in
            busy public places such as markets or main roads.
          </Text>
        </View>
      ) : null}
      {showNav ? <BottomNavBar /> : null}
    </View>
  );
}
