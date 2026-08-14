import React, {useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import {MainTabScreenProps} from '../../types/navigation';
import {useAuth} from '../../hooks/useAuth';
import {useListings} from '../../hooks/useListings';
import {useAuthStore} from '../../store/authStore';
import {MAX_ACTIVE_LISTINGS_UNVERIFIED} from '../../config/hubs';
import {ListingCard} from '../../components/ListingCard';
import {EmptyState} from '../../components/EmptyState';
import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = MainTabScreenProps<'Profile'>;

export const ProfileScreen: React.FC<Props> = ({navigation}) => {
  const {user, signOut} = useAuth();
  const selectedHub = useAuthStore(s => s.selectedHub);
  const {myListings, fetchMyListings} = useListings();

  useEffect(() => {
    fetchMyListings();
  }, []);

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
          navigation.reset({index: 0, routes: [{name: 'Auth'}]});
        },
      },
    ]);
  };

  const handleChangeHub = () => {
    navigation.navigate('HubSelect');
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
          variant="danger"
          size="md"
          fullWidth
          onPress={handleSignOut}
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
  actions: {padding: spacing.md, paddingBottom: spacing.xxl},
  actionButton: {marginBottom: spacing.sm},
});
