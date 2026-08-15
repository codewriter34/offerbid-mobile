import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {useListings} from '../../hooks/useListings';
import {useBids} from '../../hooks/useBids';
import {useRealtimeBids} from '../../hooks/useRealtimeBids';
import {useAuthStore} from '../../store/authStore';
import {openWhatsAppUrl} from '../../services/whatsappBridge';
import {listingImageUrls} from '../../utils/apiNormalize';
import {formatPrice, formatRelativeTime} from '../../utils/formatters';
import {LoadingSpinner} from '../../components/LoadingSpinner';
import {ErrorView} from '../../components/ErrorView';
import {BidCard} from '../../components/BidCard';
import {Button} from '../../components/Button';
import {CategoryBadge} from '../../components/CategoryBadge';
import {SafetyBanner} from '../../components/SafetyBanner';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';
import {Bid} from '../../types';

type Props = RootStackScreenProps<'ListingDetail'>;
const {width: SCREEN_WIDTH} = Dimensions.get('window');

export const ListingDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {listingId} = route.params;
  const {
    currentListing,
    isLoading,
    error,
    fetchListingById,
    contactSeller,
    updateListingStatus,
    reportListing,
  } = useListings();
  const {listingBids, fetchListingBids, respondToBid} = useBids();
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const [imageIndex, setImageIndex] = useState(0);

  useRealtimeBids(listingId);

  useEffect(() => {
    fetchListingById(listingId);
    fetchListingBids(listingId);
  }, [listingId]);

  const bids = listingBids[listingId] ?? [];
  const isSeller = currentListing?.sellerId === user?.id;

  const handleAccept = async (bidId: string) => {
    try {
      const updated = await respondToBid(bidId, {action: 'ACCEPT'});
      if (updated.whatsappUrl) {
        await openWhatsAppUrl(updated.whatsappUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReject = async (bidId: string) => {
    Alert.alert('Reject Bid', 'Are you sure you want to reject this bid?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await respondToBid(bidId, {action: 'REJECT'});
          } catch (err: any) {
            Alert.alert('Error', err.message);
          }
        },
      },
    ]);
  };

  const handleCounter = (bidId: string) => {
    const bid = bids.find(b => b.id === bidId);
    if (!bid || !currentListing) return;
    navigation.navigate('CounterBid', {
      bidId,
      currentAmount: bid.amount,
      listingTitle: currentListing.title,
    });
  };

  const handleWhatsApp = async (bid: Bid) => {
    if (bid.whatsappUrl) {
      await openWhatsAppUrl(bid.whatsappUrl);
      return;
    }
    if (!currentListing) return;
    try {
      const url = await contactSeller(currentListing.id);
      await openWhatsAppUrl(url);
    } catch (err: any) {
      Alert.alert('Contact failed', err.message);
    }
  };

  const handleContactAsking = async () => {
    if (!currentListing) return;
    try {
      const url = await contactSeller(currentListing.id);
      await openWhatsAppUrl(url);
    } catch (err: any) {
      Alert.alert('Contact failed', err.message);
    }
  };

  const handleReport = () => {
    Alert.prompt
      ? Alert.prompt(
          'Report listing',
          'Why are you reporting this listing?',
          async reason => {
            if (!reason || reason.trim().length < 8) {
              Alert.alert('Reason too short', 'Please write at least 8 characters.');
              return;
            }
            try {
              await reportListing(currentListing!.id, reason.trim());
              Alert.alert('Reported', 'Thanks. Our team will review this.');
            } catch (err: any) {
              Alert.alert('Report failed', err.message);
            }
          },
        )
      : Alert.alert(
          'Report listing',
          'Send a short reason (min 8 characters) from the next prompt.',
          [
            {text: 'Cancel', style: 'cancel'},
            {
              text: 'Continue',
              onPress: async () => {
                try {
                  await reportListing(
                    currentListing!.id,
                    'This listing looks suspicious or prohibited',
                  );
                  Alert.alert('Reported', 'Thanks. Our team will review this.');
                } catch (err: any) {
                  Alert.alert('Report failed', err.message);
                }
              },
            },
          ],
        );
  };

  if (isLoading && !currentListing) {
    return <LoadingSpinner message="Loading listing..." />;
  }

  if (error && !currentListing) {
    return (
      <ErrorView
        message={error}
        onRetry={() => fetchListingById(listingId)}
      />
    );
  }

  if (!currentListing) {
    return <ErrorView message="Listing not found" />;
  }

  const images = listingImageUrls(currentListing).map((url, i) => ({id: String(i), url}));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>← Back</Text>
      </TouchableOpacity>

      {images.length > 0 ? (
        <View>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={img => img.id}
            onMomentumScrollEnd={e => {
              setImageIndex(
                Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH),
              );
            }}
            renderItem={({item}) => (
              <Image
                source={{uri: item.url}}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
          {images.length > 1 && (
            <View style={styles.dotRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === imageIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      ) : (
        <View style={styles.noImage}>
          <Text style={styles.noImageText}>No photos</Text>
        </View>
      )}

      <View style={styles.content}>
        <CategoryBadge category={currentListing.category} size="md" />

        <Text style={styles.title}>{currentListing.title}</Text>
        <Text style={styles.price}>
          {formatPrice(currentListing.askingPrice, currentListing.currency)}
        </Text>
        <Text style={styles.minBid}>
          Min bid: {formatPrice(currentListing.minBidPrice, currentListing.currency)}
        </Text>
        {currentListing.highestBidAmount != null && (
          <Text style={styles.minBid}>
            Highest bid: {formatPrice(currentListing.highestBidAmount, currentListing.currency)}
          </Text>
        )}
        <Text style={styles.time}>
          Posted {formatRelativeTime(currentListing.createdAt)}
        </Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.description}>{currentListing.description}</Text>

        <View style={styles.divider} />

        {!isSeller && String(currentListing.status).toUpperCase() === 'ACTIVE' && (
          <>
            <Button
              title="Make an Offer"
              onPress={() =>
                navigation.navigate('SubmitBid', {
                  listingId: currentListing.id,
                  listingTitle: currentListing.title,
                  minBid: currentListing.minBidPrice,
                  startingPrice: currentListing.askingPrice,
                })
              }
              variant="primary"
              size="lg"
              fullWidth
              style={styles.bidButton}
            />
            <Button
              title="Contact at asking price"
              onPress={handleContactAsking}
              variant="secondary"
              size="md"
              fullWidth
              style={styles.bidButton}
            />
          </>
        )}

        {isSeller && (
          <View style={styles.sellerActions}>
            <Button
              title="Mark sold"
              variant="secondary"
              size="sm"
              onPress={() => updateListingStatus(currentListing.id, 'SOLD')}
              style={styles.actionBtn}
            />
            <Button
              title="Close"
              variant="outline"
              size="sm"
              onPress={() => updateListingStatus(currentListing.id, 'CLOSED')}
              style={styles.actionBtn}
            />
            {String(currentListing.status).toUpperCase() !== 'ACTIVE' && (
              <Button
                title="Reopen"
                variant="ghost"
                size="sm"
                onPress={() => updateListingStatus(currentListing.id, 'ACTIVE')}
                style={styles.actionBtn}
              />
            )}
          </View>
        )}

        <Button
          title="Report listing"
          variant="ghost"
          size="sm"
          onPress={handleReport}
          fullWidth
        />

        {String(currentListing.status).toUpperCase() !== 'ACTIVE' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusBannerText}>
              This listing is {currentListing.status}
            </Text>
          </View>
        )}

        <SafetyBanner hubLocation={currentListing.location ?? selectedHub?.neighborhood} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>
          Bids ({bids.length})
        </Text>

        {bids.length === 0 ? (
          <Text style={styles.noBids}>No bids yet</Text>
        ) : (
          bids.map(bid => (
            <BidCard
              key={bid.id}
              bid={bid}
              isSeller={isSeller}
              onAccept={handleAccept}
              onReject={handleReject}
              onCounter={handleCounter}
              onWhatsApp={handleWhatsApp}
            />
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  backBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  image: {
    width: SCREEN_WIDTH,
    height: 300,
  },
  dotRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.sm,
    width: '100%',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dotActive: {
    backgroundColor: colors.white,
    width: 20,
  },
  noImage: {
    height: 200,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    ...typography.body,
    color: colors.text.light,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    ...typography.h1,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  price: {
    ...typography.price,
    color: colors.gradientStart,
    fontSize: 26,
    marginTop: spacing.sm,
  },
  minBid: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  time: {
    ...typography.caption,
    color: colors.text.light,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  bidButton: {
    marginBottom: spacing.sm,
  },
  sellerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  statusBanner: {
    backgroundColor: colors.border,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  statusBannerText: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  noBids: {
    ...typography.body,
    color: colors.text.light,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
