import React, {useEffect, useState} from 'react';
import {View, Text, Image, ScrollView, Alert, TouchableOpacity} from 'react-native';
import {RootStackScreenProps} from '@app/navigation/types';
import {fetchPublicProfile, blockUser} from '@features/profile/profileService';
import {reportUser} from '@features/listings/listingService';
import {dismissScreen} from '@app/navigation/navigationRef';
import {PublicProfile} from '@shared/types';
import {formatMemberSince} from '@shared/lib/formatters';
import {AppShell} from '@shared/ui/AppShell';
import {AppIcon} from '@shared/ui/AppIcon';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {shadows} from '@shared/theme/shadows';

type Props = RootStackScreenProps<'SellerProfile'>;

export const SellerProfileScreen: React.FC<Props> = ({route, navigation}) => {
  const {userId} = route.params;
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicProfile(userId);
      setProfile(data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [userId]);

  if (loading) {
    return (
      <AppShell>
        <LoadingSpinner message="Loading profile..." />
      </AppShell>
    );
  }

  if (error || !profile) {
    return (
      <AppShell>
        <ErrorView message={error ?? 'Profile not found'} onRetry={load} />
      </AppShell>
    );
  }

  const location = [profile.location, profile.city].filter(Boolean).join(', ');
  const memberSince = profile.createdAt ? formatMemberSince(profile.createdAt) : '';

  return (
    <AppShell>
      <ScrollView className="flex-1 bg-brand-white" showsVerticalScrollIndicator={false}>
        <View className="items-center px-4 pb-6 pt-8">
          {profile.avatarUrl ? (
            <Image
              source={{uri: profile.avatarUrl}}
              className="h-20 w-20 rounded-full border-2 border-slate-200"
            />
          ) : (
            <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-black">
              <Text className="text-[28px] font-bold text-white">
                {profile.fullName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}

          <View className="mt-3 flex-row items-center gap-1.5">
            <Text className="text-[20px] font-bold text-brand-black">
              {profile.fullName}
            </Text>
            {profile.isVerified ? (
              <AppIcon name="check" size={18} color="#2070C8" />
            ) : null}
          </View>

          {location ? (
            <View className="mt-1.5 flex-row items-center">
              <AppIcon name="pin" size={14} color="#94A3B8" />
              <Text className="ml-1 text-sm text-brand-gray">{location}</Text>
            </View>
          ) : null}

          {memberSince ? (
            <View className="mt-1 flex-row items-center">
              <AppIcon name="calendar" size={14} color="#94A3B8" />
              <Text className="ml-1 text-sm text-brand-gray">{memberSince}</Text>
            </View>
          ) : null}
        </View>

        <View className="mx-4 mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4" style={shadows.card}>
          <View className="flex-row items-center">
            <View className="flex-1 items-center">
              <Text className="text-[22px] font-bold text-brand-black">
                {profile.activeListingCount}
              </Text>
              <Text className="mt-0.5 text-[12px] text-brand-gray">Active listings</Text>
            </View>
            <View className="h-8 w-px bg-slate-200" />
            <View className="flex-1 items-center">
              <AppIcon
                name={profile.isVerified ? 'shield' : 'shield'}
                size={22}
                color={profile.isVerified ? '#047857' : '#94A3B8'}
              />
              <Text className="mt-1 text-[12px] text-brand-gray">
                {profile.isVerified ? 'Verified' : 'Unverified'}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-4 mb-10 flex-row justify-center gap-6">
          <TouchableOpacity
            onPress={() =>
              Alert.alert('Report seller', 'Why are you reporting this account?', [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Scam or fraud',
                  onPress: () => {
                    void reportUser(userId, 'This seller looks like a scam or is abusive')
                      .then(() => Alert.alert('Reported', 'Thanks. Our team will review this.'))
                      .catch((err: any) =>
                        Alert.alert(
                          'Could not report',
                          err?.response?.data?.message ?? err.message,
                        ),
                      );
                  },
                },
              ])
            }
            className="py-2">
            <Text className="text-[13px] font-semibold text-brand-gray">Report user</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                'Block seller',
                'Their listings will be hidden from your feed. We will also notify OfferBid.',
                [
                  {text: 'Cancel', style: 'cancel'},
                  {
                    text: 'Block',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await blockUser(userId);
                        Alert.alert('Blocked', 'You will not see this seller in your feed.', [
                          {text: 'OK', onPress: () => dismissScreen(navigation)},
                        ]);
                      } catch (err: any) {
                        Alert.alert(
                          'Could not block',
                          err?.response?.data?.message ?? err.message,
                        );
                      }
                    },
                  },
                ],
              )
            }
            className="py-2">
            <Text className="text-[13px] font-semibold text-brand-danger">Block seller</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </AppShell>
  );
};
