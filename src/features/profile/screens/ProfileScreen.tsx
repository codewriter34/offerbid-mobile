import React, {useEffect} from 'react';
import {View, Text, ScrollView, TouchableOpacity, Alert} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {MainTabScreenProps} from '@app/navigation/types';
import {useAuth} from '@features/auth/useAuth';
import {useMyListings} from '@features/listings/useMyListings';
import {useBids} from '@features/bids/useBids';
import {useAuthStore} from '@features/auth/authStore';
import {useNotificationStore} from '@features/notifications/notificationStore';
import {
  MAX_ACTIVE_LISTINGS_UNVERIFIED,
  MAX_ACTIVE_LISTINGS_VERIFIED,
} from '@shared/config/hubs';
import {useIdentity} from '@features/identity/useIdentity';
import {uploadMedia} from '@shared/lib/uploads';
import {updateAvatar} from '@features/profile/profileService';
import {pickOneImage} from '@shared/lib/imagePicker';
import {formatMemberSince, formatPlace} from '@shared/lib/formatters';
import {AppShell} from '@shared/ui/AppShell';
import {NotificationBell} from '@shared/ui/NotificationBell';
import {AppIcon, AppIconName} from '@shared/ui/AppIcon';
import {AvatarImage} from '@shared/ui/CachedImage';
import {shadows} from '@shared/theme/shadows';
import {colors} from '@shared/theme/colors';

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, signOut} = useAuth();
  const selectedHub = useAuthStore(s => s.selectedHub);
  const updateUser = useAuthStore(s => s.updateUser);
  const unreadCount = useNotificationStore(s => s.unreadCount);
  const {myListings, fetchMyListings} = useMyListings();
  const {myBids, incomingBids, fetchMyBids, fetchIncomingBids} = useBids();
  const {identity, fetchIdentity} = useIdentity();

  useEffect(() => {
    fetchMyListings();
    fetchIdentity();
    fetchMyBids();
    fetchIncomingBids();
  }, []);

  const activeListings = myListings.filter(
    listing => String(listing.status).toUpperCase() === 'ACTIVE',
  );
  const soldListings = myListings.filter(
    listing => String(listing.status).toUpperCase() === 'SOLD',
  );
  const listingCap =
    identity?.listingCap ??
    (user?.isVerified ? MAX_ACTIVE_LISTINGS_VERIFIED : MAX_ACTIVE_LISTINGS_UNVERIFIED);
  const verified = identity?.status === 'APPROVED' || user?.isVerified;
  const location = formatPlace(
    selectedHub?.neighborhood ?? user?.location,
    selectedHub?.city ?? user?.city,
  );
  const memberSince = user?.createdAt ? formatMemberSince(user.createdAt) : '';

  const handleAvatar = async () => {
    const uri = await pickOneImage(0.8);
    if (!uri) return;
    try {
      const url = await uploadMedia(uri, 'AVATAR');
      const mapped = await updateAvatar(url);
      updateUser({avatarUrl: mapped.avatarUrl ?? url});
    } catch (err: any) {
      Alert.alert('Avatar failed', err?.response?.data?.message ?? err.message);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.navigate('Explore');
        },
      },
    ]);
  };

  return (
    <AppShell>
      <ScrollView className="flex-1 bg-brand-white" showsVerticalScrollIndicator={false}>
        <View className="border-b border-slate-200 bg-white px-4 pb-3 pt-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-[22px] font-bold text-brand-black">Profile</Text>
              <Text className="mt-0.5 text-sm text-brand-gray">
                Manage your account and activity.
              </Text>
            </View>
            <NotificationBell
              unreadCount={unreadCount}
              onPress={() => navigation.navigate('Notifications')}
            />
          </View>
        </View>

        <View className="px-4 pt-4">
          <View
            className="overflow-hidden rounded-2xl px-4 py-4"
            style={{backgroundColor: colors.brand.black}}>
            <View className="absolute inset-0" pointerEvents="none">
              <Svg width="100%" height="100%" viewBox="0 0 360 160" preserveAspectRatio="none">
                <Path
                  d="M0 108C48 92 86 128 140 118C194 108 228 72 280 84C318 93 342 118 360 132V160H0Z"
                  fill="rgba(255,255,255,0.06)"
                />
                <Path
                  d="M0 128C62 114 110 146 168 134C226 122 252 96 308 108C332 114 348 128 360 138V160H0Z"
                  fill="rgba(255,255,255,0.05)"
                />
              </Svg>
            </View>
            <View className="flex-row items-start">
              <TouchableOpacity onPress={handleAvatar} className="relative">
                <AvatarImage uri={user?.avatarUrl} name={user?.fullName} size={64} />
                <View className="absolute -bottom-0.5 -right-0.5 h-6 w-6 items-center justify-center rounded-full bg-white">
                  <AppIcon name="camera" size={13} color={colors.brand.black} />
                </View>
              </TouchableOpacity>

              <View className="ml-3 min-w-0 flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[18px] font-bold text-white" numberOfLines={1}>
                    {user?.fullName ?? 'User'}
                  </Text>
                  {verified ? <AppIcon name="check" size={16} color="#93C5FD" /> : null}
                </View>
                {user?.email ? (
                  <Text className="mt-0.5 text-[13px] text-slate-300" numberOfLines={1}>
                    {user.email}
                  </Text>
                ) : null}
                <View className="mt-2 flex-row flex-wrap gap-2">
                  {location ? (
                    <View className="flex-row items-center rounded-full bg-white/10 px-2.5 py-1">
                      <AppIcon name="pin" size={12} color="#E2E8F0" />
                      <Text className="ml-1 text-[11px] text-slate-200">{location}</Text>
                    </View>
                  ) : null}
                  {memberSince ? (
                    <View className="flex-row items-center rounded-full bg-white/10 px-2.5 py-1">
                      <AppIcon name="calendar" size={12} color="#E2E8F0" />
                      <Text className="ml-1 text-[11px] text-slate-200">{memberSince}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          </View>

          <View
            className="mt-3 flex-row rounded-2xl border border-slate-200 bg-white px-2 py-3"
            style={shadows.card}>
            <Stat
              icon="tag"
              iconColor="#334155"
              iconBg="#F1F5F9"
              value={activeListings.length}
              label="Active listings"
            />
            <Stat
              icon="bag"
              iconColor="#047857"
              iconBg="#D1FAE5"
              value={soldListings.length}
              label="Sold items"
            />
            <Stat
              icon="store"
              iconColor="#B45309"
              iconBg="#FEF3C7"
              value={myListings.length}
              label="Total listings"
            />
          </View>

          <View className="mt-3 rounded-2xl bg-[#D1FAE5] px-3.5 py-3">
            <View className="flex-row items-start">
              <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white">
                <AppIcon name="shield" size={18} color="#047857" />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[14px] font-bold text-brand-black">
                  {verified ? 'Identity verified' : "You're almost there!"}
                </Text>
                <Text className="mt-0.5 text-[12px] leading-4 text-brand-charcoal">
                  {verified
                    ? `Approved. You can have up to ${listingCap} active listings.`
                    : `Complete verification to raise your listing cap from ${listingCap} to 10.`}
                </Text>
                <Text className="mt-1 text-[12px] font-semibold text-brand-charcoal">
                  {activeListings.length}/{listingCap} active listings used
                </Text>
              </View>
            </View>
            {!verified ? (
              <TouchableOpacity
                onPress={() => navigation.navigate('Identity')}
                className="mt-3 items-center rounded-xl border border-[#047857] bg-white py-2.5">
                <Text className="text-[13px] font-semibold text-[#047857]">Get verified</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-[17px] font-bold text-brand-black">My Activity</Text>
          </View>
          <View className="mt-2 flex-row gap-2">
            <ActivityTile
              icon="bag"
              label="Listings"
              value={myListings.length}
              onPress={() => navigation.navigate('Selling')}
            />
            <ActivityTile
              icon="bids"
              label="Bids made"
              value={myBids.length}
              onPress={() => navigation.navigate('MyBids')}
            />
            <ActivityTile
              icon="tag"
              label="Offers received"
              value={incomingBids.length}
              onPress={() => navigation.navigate('Selling')}
            />
          </View>

          <View className="mb-8 mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <MenuRow
              icon="bell"
              iconBg="#DBEAFE"
              iconColor="#2070C8"
              title="Notifications"
              subtitle="Bid and listing updates"
              onPress={() => navigation.navigate('Notifications')}
            />
            <MenuRow
              icon="pin"
              iconBg="#FEF3C7"
              iconColor="#B45309"
              title="Change location"
              subtitle="Update your city and neighborhood"
              onPress={() => navigation.navigate('HubSelect')}
            />
            <MenuRow
              icon="shield"
              iconBg="#D1FAE5"
              iconColor="#047857"
              title="Identity"
              subtitle={verified ? 'Verified seller' : 'Verify to sell with more trust'}
              onPress={() => navigation.navigate('Identity')}
            />
            <MenuRow
              icon="logout"
              iconBg="#F1F5F9"
              iconColor="#334155"
              title="Log out"
              subtitle="Sign out from your account"
              last
              onPress={handleSignOut}
            />
          </View>
        </View>
      </ScrollView>
    </AppShell>
  );
};

function Stat({
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: AppIconName;
  iconColor: string;
  iconBg: string;
  value: number;
  label: string;
}) {
  return (
    <View className="flex-1 items-center">
      <View
        className="mb-1.5 h-8 w-8 items-center justify-center rounded-lg"
        style={{backgroundColor: iconBg}}>
        <AppIcon name={icon} size={16} color={iconColor} />
      </View>
      <Text className="text-[20px] font-bold text-brand-black">{value}</Text>
      <Text className="mt-0.5 text-center text-[11px] text-brand-gray">{label}</Text>
    </View>
  );
}

function ActivityTile({
  icon,
  label,
  value,
  onPress,
}: {
  icon: AppIconName;
  label: string;
  value: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      className="flex-1 items-center rounded-2xl border border-slate-200 bg-white px-2 py-3">
      <View className="mb-2 h-9 w-9 items-center justify-center rounded-xl bg-[#DBEAFE]">
        <AppIcon name={icon} size={18} color="#2070C8" />
      </View>
      <Text className="text-[12px] font-semibold text-brand-black">{label}</Text>
      <Text className="mt-0.5 text-[15px] font-bold text-brand-black">{value}</Text>
    </TouchableOpacity>
  );
}

function MenuRow({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  last,
  onPress,
}: {
  icon: AppIconName;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  last?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      className={`flex-row items-center px-3.5 py-3.5 ${last ? '' : 'border-b border-slate-100'}`}>
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-xl"
        style={{backgroundColor: iconBg}}>
        <AppIcon name={icon} size={18} color={iconColor} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[15px] font-semibold text-brand-black">{title}</Text>
        <Text className="mt-0.5 text-[12px] text-brand-gray">{subtitle}</Text>
      </View>
      <AppIcon name="chevron" size={16} color="#94A3B8" />
    </TouchableOpacity>
  );
}
