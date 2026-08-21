import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
} from 'react-native';
import {RootStackScreenProps} from '@app/navigation/types';
import {useListing} from '@features/listings/useListing';
import {ListingCard} from '@features/listings/components/ListingCard';
import {useBids} from '@features/bids/useBids';
import {useRealtimeBids} from '@features/bids/useRealtimeBids';
import {useAuthStore} from '@features/auth/authStore';
import {openDealWhatsApp, openWhatsAppUrl} from '@shared/lib/whatsapp';
import {listingImageUrls} from '@api/normalize';
import {formatMemberSince, formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {BidCard} from '@features/bids/components/BidCard';
import {CategoryBadge} from '@shared/ui/CategoryBadge';
import {SafetyBanner} from '@shared/ui/SafetyBanner';
import {AppShell} from '@shared/ui/AppShell';
import {AppIcon} from '@shared/ui/AppIcon';
import {shadows} from '@shared/theme/shadows';
import {Bid, ListingStatus} from '@shared/types';

type Props = RootStackScreenProps<'ListingDetail'>;
const {width: SCREEN_WIDTH} = Dimensions.get('window');
const IMAGE_HEIGHT = 300;

export const ListingDetailScreen: React.FC<Props> = ({route, navigation}) => {
  const {listingId} = route.params;
  const {
    currentListing,
    similarListings,
    isLoading,
    error,
    fetchListingById,
    contactSeller,
    updateListingStatus,
    updateListing: updateListingHook,
    deleteListing: deleteListingHook,
    incrementViewCount,
    fetchSimilarListings,
    reportListing,
  } = useListing();
  const {listingBids, fetchListingBids, respondToBid, respondToCounter} = useBids();
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const [imageIndex, setImageIndex] = useState(0);

  useRealtimeBids(listingId);

  useEffect(() => {
    fetchListingById(listingId);
    fetchListingBids(listingId);
    incrementViewCount(listingId);
    fetchSimilarListings(listingId);
  }, [listingId]);

  const bids = listingBids[listingId] ?? [];
  const isSeller = currentListing?.sellerId === user?.id;
  const listingStatus = String(currentListing?.status ?? '').toUpperCase();
  const isActive = listingStatus === 'ACTIVE';

  const handleAccept = async (bidId: string) => {
    const bid = bids.find(item => item.id === bidId);
    const isBuyerCounter =
      !isSeller && String(bid?.status).toUpperCase() === 'COUNTERED';
    try {
      const updated = isBuyerCounter
        ? await respondToCounter(bidId, {action: 'ACCEPT'})
        : await respondToBid(bidId, {action: 'ACCEPT'});
      if (updated.whatsappUrl) {
        await openWhatsAppUrl(updated.whatsappUrl);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleReject = async (bidId: string) => {
    const bid = bids.find(item => item.id === bidId);
    const isBuyerCounter =
      !isSeller && String(bid?.status).toUpperCase() === 'COUNTERED';
    Alert.alert(
      isBuyerCounter ? 'Decline counter' : 'Reject Bid',
      isBuyerCounter
        ? 'Decline this counter offer?'
        : 'Are you sure you want to reject this bid?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: isBuyerCounter ? 'Decline' : 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isBuyerCounter) {
                await respondToCounter(bidId, {action: 'REJECT'});
              } else {
                await respondToBid(bidId, {action: 'REJECT'});
              }
            } catch (err: any) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ],
    );
  };

  const handleCounter = (bidId: string) => {
    const bid = bids.find(item => item.id === bidId);
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
    if (!isSeller && currentListing) {
      try {
        const url = await contactSeller(currentListing.id);
        await openWhatsAppUrl(url);
        return;
      } catch (err: any) {
        Alert.alert('Contact failed', err.message);
        return;
      }
    }
    await openDealWhatsApp(null);
  };

  const handleContactAsking = async () => {
    if (!user) {
      navigation.navigate('Auth');
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

  const shareMessage = currentListing
    ? [
        currentListing.title,
        formatPrice(currentListing.askingPrice, currentListing.currency),
        currentListing.description.trim(),
        'Shared from OfferBid',
      ]
        .filter(Boolean)
        .join('\n')
    : '';

  const handleShare = async () => {
    if (!currentListing) return;
    try {
      await Share.share({
        title: currentListing.title,
        message: shareMessage,
      });
    } catch {
      // User dismissed the sheet
    }
  };

  const handleShareWhatsApp = async () => {
    if (!shareMessage) return;
    await openWhatsAppUrl(
      `https://wa.me/?text=${encodeURIComponent(shareMessage)}`,
    );
  };

  const changeStatus = async (status: ListingStatus) => {
    if (!currentListing) return;
    try {
      await updateListingStatus(currentListing.id, status);
    } catch (err: any) {
      Alert.alert('Update failed', err?.response?.data?.message ?? err.message);
    }
  };

  const handleEdit = () => {
    if (!currentListing) return;
    navigation.navigate('EditListing', {listingId: currentListing.id});
  };

  const handleDelete = () => {
    if (!currentListing) return;
    Alert.alert(
      'Delete listing',
      'Are you sure? This cannot be undone. All pending bids will be cancelled.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteListingHook(currentListing.id);
              navigation.goBack();
            } catch (err: any) {
              const msg = err?.response?.data?.message ?? err.message;
              Alert.alert('Delete failed', msg);
            }
          },
        },
      ],
    );
  };

  const handleSellerTap = () => {
    if (!currentListing?.seller?.id || isSeller) return;
    navigation.navigate('SellerProfile', {userId: currentListing.seller.id});
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
    return (
      <AppShell safetyRibbon>
        <LoadingSpinner message="Loading listing..." />
      </AppShell>
    );
  }

  if (error && !currentListing) {
    return (
      <AppShell safetyRibbon>
        <ErrorView message={error} onRetry={() => fetchListingById(listingId)} />
      </AppShell>
    );
  }

  if (!currentListing) {
    return (
      <AppShell safetyRibbon>
        <ErrorView message="Listing not found" />
      </AppShell>
    );
  }

  const images = listingImageUrls(currentListing).map((url, i) => ({id: String(i), url}));

  return (
    <AppShell safetyRibbon>
      <ScrollView className="flex-1 bg-brand-white" showsVerticalScrollIndicator={false}>
        <View className="relative">
          {images.length > 0 ? (
            <FlatList
              data={images}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={img => img.id}
              onMomentumScrollEnd={e => {
                setImageIndex(Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH));
              }}
              renderItem={({item}) => (
                <Image
                  source={{uri: item.url}}
                  style={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT}}
                  resizeMode="cover"
                />
              )}
            />
          ) : (
            <View
              className="items-center justify-center bg-slate-200"
              style={{height: 200}}>
              <Text className="text-sm text-brand-gray">No photos</Text>
            </View>
          )}

          <View className="absolute left-4 right-4 top-3 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
              accessibilityRole="button"
              accessibilityLabel="Go back">
              <AppIcon name="back" size={18} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleShare}
              className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
              accessibilityRole="button"
              accessibilityLabel="Share listing">
              <AppIcon name="share" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {images.length > 1 ? (
            <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
              {images.map((_, i) => (
                <View
                  key={i}
                  className={`h-2 rounded-full ${
                    i === imageIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'
                  }`}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View className="px-4 pb-8 pt-4">
          <CategoryBadge category={currentListing.category} size="md" />
          <Text className="mt-2 text-[22px] font-bold text-brand-black">
            {currentListing.title}
          </Text>
          <Text className="mt-1 text-[26px] font-bold text-brand-black">
            {formatPrice(currentListing.askingPrice, currentListing.currency)}
          </Text>
          <Text className="mt-1 text-sm text-brand-charcoal">
            Min bid: {formatPrice(currentListing.minBidPrice, currentListing.currency)}
          </Text>
          {currentListing.highestBidAmount != null ? (
            <Text className="mt-0.5 text-sm text-brand-charcoal">
              Highest bid:{' '}
              {formatPrice(currentListing.highestBidAmount, currentListing.currency)}
            </Text>
          ) : null}
          <View className="mt-1 flex-row items-center gap-3">
            <Text className="text-xs text-brand-gray">
              Posted {formatRelativeTime(currentListing.createdAt)}
            </Text>
            {currentListing.viewCount > 0 ? (
              <Text className="text-xs text-brand-gray">
                {currentListing.viewCount} {currentListing.viewCount === 1 ? 'view' : 'views'}
              </Text>
            ) : null}
          </View>

          {currentListing.seller ? (
            <TouchableOpacity
              onPress={handleSellerTap}
              disabled={isSeller}
              activeOpacity={isSeller ? 1 : 0.7}
              className="mt-4 rounded-2xl border border-slate-200 bg-white px-3.5 py-3"
              style={shadows.card}>
              <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
                Seller
              </Text>
              <View className="mt-2 flex-row items-center">
                {currentListing.seller.avatarUrl ? (
                  <Image
                    source={{uri: currentListing.seller.avatarUrl}}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-black">
                    <Text className="text-lg font-bold text-white">
                      {currentListing.seller.fullName.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View className="ml-3 min-w-0 flex-1">
                  <Text className="text-[16px] font-semibold text-brand-black">
                    {currentListing.seller.fullName}
                  </Text>
                  {currentListing.seller.createdAt ? (
                    <Text className="mt-0.5 text-xs text-brand-gray">
                      {formatMemberSince(currentListing.seller.createdAt)}
                    </Text>
                  ) : null}
                </View>
              </View>
            </TouchableOpacity>
          ) : null}

          <View className="mt-4 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
            <Text className="text-[15px] font-bold text-brand-black">Description</Text>
            <Text className="mt-1.5 text-[14px] leading-5 text-brand-charcoal">
              {currentListing.description}
            </Text>
          </View>

          <View className="mt-4 rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
            <Text className="text-[15px] font-bold text-brand-black">Share this listing</Text>
            <Text className="mt-0.5 text-[12px] text-brand-gray">
              Tap an icon to send it to a friend.
            </Text>
            <View className="mt-3 flex-row gap-3">
              <TouchableOpacity
                onPress={handleShareWhatsApp}
                className="flex-1 items-center rounded-xl bg-[#DCFCE7] py-3"
                accessibilityRole="button"
                accessibilityLabel="Share on WhatsApp">
                <AppIcon name="whatsapp" size={22} color="#16A34A" />
                <Text className="mt-1 text-[12px] font-semibold text-[#15803D]">
                  WhatsApp
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                className="flex-1 items-center rounded-xl bg-[#DBEAFE] py-3"
                accessibilityRole="button"
                accessibilityLabel="Share to other apps">
                <AppIcon name="share" size={22} color="#2070C8" />
                <Text className="mt-1 text-[12px] font-semibold text-brand-blue">
                  More
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {!isSeller && listingStatus === 'SOLD' ? (
            <View className="mt-4 rounded-2xl bg-[#D1FAE5] px-3.5 py-3">
              <Text className="text-[15px] font-bold text-[#047857]">Sold</Text>
              <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal">
                This item is no longer available. Offers are closed.
              </Text>
            </View>
          ) : null}

          {!isSeller && listingStatus === 'CLOSED' ? (
            <View className="mt-4 rounded-2xl bg-[#F1F5F9] px-3.5 py-3">
              <Text className="text-[15px] font-bold text-brand-charcoal">
                No longer available
              </Text>
              <Text className="mt-0.5 text-[13px] leading-4 text-brand-gray">
                The seller closed this listing. You cannot make a new offer.
              </Text>
            </View>
          ) : null}

          {!isSeller && isActive ? (
            <View className="mt-4">
              <TouchableOpacity
                onPress={() => {
                  if (!user) {
                    navigation.navigate('Auth');
                    return;
                  }
                  navigation.navigate('SubmitBid', {
                    listingId: currentListing.id,
                    listingTitle: currentListing.title,
                    minBid: currentListing.minBidPrice,
                    startingPrice: currentListing.askingPrice,
                  });
                }}
                className="items-center rounded-xl bg-brand-blue py-3.5">
                <Text className="text-[15px] font-semibold text-white">Make an Offer</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleContactAsking}
                className="mt-2 items-center rounded-xl border border-slate-200 bg-white py-3">
                <Text className="text-[14px] font-semibold text-brand-black">
                  Contact at asking price
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {isSeller ? (
            <View className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {listingStatus === 'SOLD' ? (
                <View className="bg-[#D1FAE5] px-4 py-3">
                  <Text className="text-[15px] font-bold text-[#047857]">Sold</Text>
                  <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal">
                    This listing is marked as sold. Buyers can no longer make offers.
                  </Text>
                </View>
              ) : listingStatus === 'CLOSED' ? (
                <View className="bg-[#F1F5F9] px-4 py-3">
                  <Text className="text-[15px] font-bold text-brand-charcoal">Closed</Text>
                  <Text className="mt-0.5 text-[13px] leading-4 text-brand-gray">
                    This listing is hidden from Explore. Reopen it to receive offers again.
                  </Text>
                </View>
              ) : (
                <View className="px-4 py-3">
                  <Text className="text-[15px] font-bold text-brand-black">
                    Manage listing
                  </Text>
                  <Text className="mt-0.5 text-[13px] text-brand-gray">
                    Mark it sold when the deal is done, or close it if you no longer want
                    offers.
                  </Text>
                </View>
              )}

              <View className="flex-row gap-2 border-t border-slate-100 px-4 py-3">
                {isActive ? (
                  <>
                    <TouchableOpacity
                      onPress={() => {
                        Alert.alert(
                          'Mark as sold',
                          'This will stop new offers on this listing.',
                          [
                            {text: 'Cancel', style: 'cancel'},
                            {
                              text: 'Mark sold',
                              onPress: () => void changeStatus('SOLD'),
                            },
                          ],
                        );
                      }}
                      className="flex-1 items-center rounded-xl bg-[#059669] py-2.5">
                      <Text className="text-[13px] font-semibold text-white">
                        Mark as sold
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => void changeStatus('CLOSED')}
                      className="flex-1 items-center rounded-xl border border-slate-200 py-2.5">
                      <Text className="text-[13px] font-semibold text-brand-charcoal">
                        Close
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={() => void changeStatus('ACTIVE')}
                    className="flex-1 items-center rounded-xl bg-brand-blue py-2.5">
                    <Text className="text-[13px] font-semibold text-white">
                      Reopen listing
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <View className="flex-row gap-2 border-t border-slate-100 px-4 py-3">
                {isActive ? (
                  <TouchableOpacity
                    onPress={handleEdit}
                    className="flex-1 items-center rounded-xl bg-brand-blue py-2.5">
                    <Text className="text-[13px] font-semibold text-white">
                      Edit
                    </Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={handleDelete}
                  className="flex-1 items-center rounded-xl bg-[#FEE2E2] py-2.5">
                  <Text className="text-[13px] font-semibold text-[#DC2626]">
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {!isSeller ? (
            <TouchableOpacity onPress={handleReport} className="mt-3 items-center py-2">
              <Text className="text-[13px] font-semibold text-brand-gray">
                Report listing
              </Text>
            </TouchableOpacity>
          ) : null}

          <View className="mt-3">
            <SafetyBanner
              hubLocation={currentListing.location ?? selectedHub?.neighborhood}
            />
          </View>

          <Text className="mb-2 mt-5 text-[17px] font-bold text-brand-black">
            Bids ({bids.length})
          </Text>
          {bids.length === 0 ? (
            <Text className="py-6 text-center text-sm text-brand-gray">No bids yet</Text>
          ) : (
            bids.map(bid => (
              <BidCard
                key={bid.id}
                bid={bid}
                isSeller={!!isSeller}
                onAccept={handleAccept}
                onReject={handleReject}
                onCounter={handleCounter}
                onWhatsApp={handleWhatsApp}
              />
            ))
          )}

          {similarListings.length > 0 ? (
            <>
              <Text className="mb-2 mt-5 text-[17px] font-bold text-brand-black">
                Similar listings
              </Text>
              <FlatList
                data={similarListings}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id}
                renderItem={({item}) => (
                  <TouchableOpacity
                    onPress={() => navigation.push('ListingDetail', {listingId: item.id})}
                    activeOpacity={0.8}
                    style={{width: SCREEN_WIDTH * 0.6, marginRight: 12}}>
                    <ListingCard listing={item} />
                  </TouchableOpacity>
                )}
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </AppShell>
  );
};
