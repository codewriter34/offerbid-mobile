import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  TextInput,
} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useAuth} from '../../hooks/useAuth';
import {useListings} from '../../hooks/useListings';
import {useAuthStore} from '../../store/authStore';
import {MAX_ACTIVE_LISTINGS_UNVERIFIED} from '../../config/hubs';
import {ListingCard} from '../../components/ListingCard';
import {EmptyState} from '../../components/EmptyState';
import {Button} from '../../components/Button';
import {deleteAccount, updateWhatsApp} from '../../services/moderationService';
import {apiErrorMessage} from '../../utils/whatsappPrompt';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, signOut} = useAuth();
  const selectedHub = useAuthStore(s => s.selectedHub);
  const updateUser = useAuthStore(s => s.updateUser);
  const {myListings, fetchMyListings} = useListings();
  const [whatsapp, setWhatsapp] = useState(user?.phone?.replace(/\D/g, '') ?? '');
  const [savingWhatsApp, setSavingWhatsApp] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    fetchMyListings();
  }, []);

  useEffect(() => {
    if (user?.phone) {
      setWhatsapp(user.phone.replace(/\D/g, ''));
    }
  }, [user?.phone]);

  const activeListings = myListings.filter(l => l.status === 'active');
  const soldListings = myListings.filter(l => l.status === 'sold');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          navigation.getParent()?.reset({
            index: 0,
            routes: [{name: 'Auth'}],
          });
        },
      },
    ]);
  };

  const handleChangeHub = () => {
    navigation.navigate('HubSelect');
  };

  const handleSaveWhatsApp = async () => {
    const digits = whatsapp.replace(/\D/g, '');
    if (!/^\d{7,15}$/.test(digits)) {
      Alert.alert(
        'Invalid number',
        'Enter your WhatsApp number without the country code (7–15 digits).',
      );
      return;
    }
    setSavingWhatsApp(true);
    try {
      const updated = await updateWhatsApp(digits);
      updateUser({phone: updated?.phone ?? digits});
      Alert.alert('Saved', 'Your WhatsApp number is on your profile.');
    } catch (err) {
      Alert.alert('Could not save', apiErrorMessage(err, 'Try again in a moment.'));
    } finally {
      setSavingWhatsApp(false);
    }
  };

  const performDelete = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      await signOut();
      navigation.getParent()?.reset({
        index: 0,
        routes: [{name: 'Auth'}],
      });
    } catch (err) {
      Alert.alert(
        'Could not delete account',
        apiErrorMessage(err, 'Try again in a moment.'),
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your account, listings, and bids. You cannot undo this.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Continue',
          style: 'destructive',
          onPress: () =>
            Alert.alert(
              'Are you sure?',
              'Your OfferBid account will be deleted immediately.',
              [
                {text: 'Cancel', style: 'cancel'},
                {
                  text: 'Delete account',
                  style: 'destructive',
                  onPress: () => {
                    void performDelete();
                  },
                },
              ],
            ),
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.display_name?.charAt(0)?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.display_name ?? 'User'}</Text>
        {selectedHub && (
          <Text style={styles.hub}>
            📍 {selectedHub.neighborhood}, {selectedHub.city}
          </Text>
        )}
        <View style={styles.badges}>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: user?.is_verified
                  ? colors.success + '20'
                  : colors.warning + '20',
              },
            ]}>
            <Text
              style={[
                styles.badgeText,
                {
                  color: user?.is_verified
                    ? colors.success
                    : colors.warning,
                },
              ]}>
              {user?.is_verified ? 'Verified' : 'Unverified'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{activeListings.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{soldListings.length}</Text>
          <Text style={styles.statLabel}>Sold</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statNumber}>{myListings.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {!user?.is_verified && (
        <View style={styles.scamGuardCard}>
          <Text style={styles.scamGuardTitle}>Scam Guard</Text>
          <Text style={styles.scamGuardText}>
            {activeListings.length}/{MAX_ACTIVE_LISTINGS_UNVERIFIED} active
            listings used. Verify your identity to remove this limit.
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(activeListings.length / MAX_ACTIVE_LISTINGS_UNVERIFIED) * 100}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Listings</Text>
        {myListings.length === 0 ? (
          <EmptyState
            title="No listings"
            message="You haven't posted anything yet."
            actionLabel="Create Listing"
            onAction={() => navigation.navigate('CreateListing')}
          />
        ) : (
          myListings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onPress={id =>
                navigation.navigate('ListingDetail', {listingId: id})
              }
            />
          ))
        )}
      </View>

      <View style={styles.whatsappCard}>
        <Text style={styles.sectionTitle}>WhatsApp (optional)</Text>
        <Text style={styles.whatsappHint}>
          Not required to use OfferBid. Add it so accepted deals can continue on
          WhatsApp.
        </Text>
        <View style={styles.phoneRow}>
          <Text style={styles.countryPrefix}>+237</Text>
          <TextInput
            style={styles.phoneInput}
            keyboardType="phone-pad"
            placeholder="6XXXXXXXX"
            placeholderTextColor={colors.text.light}
            value={whatsapp}
            onChangeText={setWhatsapp}
            maxLength={15}
          />
        </View>
        <Button
          title="Save WhatsApp"
          variant="outline"
          size="md"
          fullWidth
          loading={savingWhatsApp}
          onPress={() => {
            void handleSaveWhatsApp();
          }}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.actions}>
        <Button
          title="Change Location"
          variant="outline"
          size="md"
          fullWidth
          onPress={handleChangeHub}
          style={styles.actionButton}
        />
        <Button
          title="Sign Out"
          variant="outline"
          size="md"
          fullWidth
          onPress={handleSignOut}
          style={styles.actionButton}
        />
        <Button
          title="Delete account"
          variant="danger"
          size="md"
          fullWidth
          loading={deletingAccount}
          onPress={handleDeleteAccount}
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background},
  profileHeader: {
    backgroundColor: colors.gradientStart,
    padding: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {fontSize: 32, fontWeight: '700', color: colors.gradientStart},
  name: {...typography.h2, color: colors.white, marginBottom: spacing.xs},
  hub: {...typography.bodySmall, color: 'rgba(255,255,255,0.8)'},
  badges: {flexDirection: 'row', marginTop: spacing.sm},
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {...typography.caption, fontWeight: '700'},
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: -spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stat: {flex: 1, alignItems: 'center'},
  statNumber: {...typography.h2, color: colors.text.primary},
  statLabel: {...typography.caption, color: colors.text.secondary, marginTop: 2},
  statDivider: {width: 1, backgroundColor: colors.border},
  scamGuardCard: {
    backgroundColor: '#FFF8E1',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  scamGuardTitle: {...typography.bodySmall, fontWeight: '700', color: colors.warning},
  scamGuardText: {...typography.caption, color: colors.text.secondary, marginTop: spacing.xs},
  progressBar: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 3,
  },
  section: {padding: spacing.md},
  sectionTitle: {...typography.h3, color: colors.text.primary, marginBottom: spacing.md},
  whatsappCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
  },
  whatsappHint: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  countryPrefix: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.secondary,
    paddingHorizontal: spacing.md,
  },
  phoneInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
  },
  actions: {padding: spacing.md, paddingBottom: spacing.xxl},
  actionButton: {marginBottom: spacing.sm},
});
