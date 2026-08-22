import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Pressable,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackScreenProps} from '@app/navigation/types';
import {dismissScreen} from '@app/navigation/navigationRef';
import {useListing} from '@features/listings/useListing';
import {ListingCard} from '@features/listings/components/ListingCard';
import {useBids} from '@features/bids/useBids';
import {useRealtimeBids} from '@features/bids/useRealtimeBids';
import {useAuthStore} from '@features/auth/authStore';
import {openDealWhatsApp, openWhatsAppUrl} from '@shared/lib/whatsapp';
import {listingImageUrls} from '@api/normalize';
import {formatMemberSince, formatPlace, formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {LoadingSpinner} from '@shared/ui/LoadingSpinner';
import {ErrorView} from '@shared/ui/ErrorView';
import {BidCard} from '@features/bids/components/BidCard';
import {CategoryBadge} from '@shared/ui/CategoryBadge';
import {SafetyBanner} from '@shared/ui/SafetyBanner';
import {AppShell} from '@shared/ui/AppShell';
import {AppIcon} from '@shared/ui/AppIcon';
import {AvatarImage, MediaThumb} from '@shared/ui/CachedImage';
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
  const {listingBids, myBids, fetchListingBids, fetchMyBids, respondToBid, respondToCounter} = useBids();
  const user = useAuthStore(s => s.user);
  const selectedHub = useAuthStore(s => s.selectedHub);
  const insets = useSafeAreaInsets();
  const [imageIndex, setImageIndex] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useRealtimeBids(listingId);

  useEffect(() => {
    fetchListingById(listingId);
    fetchListingBids(listingId);
    incrementViewCount(listingId);
    fetchSimilarListings(listingId);
    if (user) void fetchMyBids();
  }, [listingId, user?.id]);

  useEffect(() => {
    if (!reportOpen) {
      setKeyboardHeight(0);
      return;
    }
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [reportOpen]);

  const bids = listingBids[listingId] ?? [];
  const isSeller = currentListing?.sellerId === user?.id;
  const listingStatus = String(currentListing?.status ?? '').toUpperCase();
  const isActive = listingStatus === 'ACTIVE';
  const ownBid =
    user && !isSeller
      ? myBids.find(bid => bid.listingId === listingId) ??
        bids.find(bid => bid.buyerId === user.id)
      : undefined;
  const ownBidStatus = String(ownBid?.status ?? '').toUpperCase();

  const resolveBid = (bidId: string) =>
    bids.find(item => item.id === bidId) ??
    myBids.find(item => item.id === bidId) ??
    (ownBid?.id === bidId ? ownBid : undefined);

  const openBuyerRecounter = (bid?: Bid) => {
    const source = bid ?? ownBid;
    if (!source || !currentListing) return;
    navigation.navigate('SubmitBid', {
      listingId: currentListing.id,
      listingTitle: currentListing.title,
      minBid: currentListing.minBidPrice,
      startingPrice: currentListing.askingPrice,
      currency: currentListing.currency,
      recounter: true,
      sellerCounterAmount: source.counterAmount ?? source.amount,
      currentAmount: source.amount,
    });
  };

  const handleAccept = async (bidId: string) => {
    try {
      const updated = !isSeller
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
    const isBuyerAction = !isSeller;
    Alert.alert(
      isBuyerAction ? 'Decline counter' : 'Reject Bid',
      isBuyerAction
        ? 'Decline this counter offer?'
        : 'Are you sure you want to reject this bid?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: isBuyerAction ? 'Decline' : 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              if (isBuyerAction) {
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
    const bid = resolveBid(bidId);
    if (!currentListing) return;
    if (!isSeller) {
      openBuyerRecounter(bid);
      return;
    }
    if (!bid) return;
    navigation.navigate('CounterBid', {
      bidId,
      currentAmount: bid.counterAmount ?? bid.amount,
      listingTitle: currentListing.title,
      currency: currentListing.currency,
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

  const handleShare = async () => {
    if (!currentListing) return;
    const publicId = currentListing.publicId || currentListing.id;
    try {
      await Share.share({
        title: 'OfferBid listing',
        message: publicId,
      });
    } catch {
      // User dismissed the sheet
    }
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
    setReportReason('');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!currentListing) return;
    if (reportReason.trim().length < 8) {
      Alert.alert('Reason too short', 'Please write at least 8 characters.');
      return;
    }
    setReporting(true);
    try {
      await reportListing(currentListing.id, reportReason.trim());
      setReportOpen(false);
      Alert.alert('Reported', 'Thanks. Our team will review this.');
    } catch (err: any) {
      Alert.alert('Report failed', err.message);
    } finally {
      setReporting(false);
    }
  };

  if (isLoading && !currentListing) {
    return (
      <AppShell>
        <LoadingSpinner message="Loading listing..." />
      </AppShell>
    );
  }

  if (error && !currentListing) {
    return (
      <AppShell>
        <ErrorView message={error} onRetry={() => fetchListingById(listingId)} />
      </AppShell>
    );
  }

  if (!currentListing) {
    return (
      <AppShell>
        <ErrorView message="Listing not found" />
      </AppShell>
    );
  }

  const images = listingImageUrls(currentListing).map((url, i) => ({id: String(i), url}));

  return (
    <AppShell>
      <View className="flex-1">
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
                <MediaThumb
                  uri={item.url}
                  recyclingKey={item.id}
                  style={{width: SCREEN_WIDTH, height: IMAGE_HEIGHT}}
                  iconSize={36}
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
              onPress={() => dismissScreen(navigation)}
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
                <AvatarImage
                  uri={currentListing.seller.avatarUrl}
                  name={currentListing.seller.fullName}
                  size={48}
                />
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

          {!isSeller && isActive && ownBid && ownBidStatus === 'COUNTERED' ? (
            <View
              className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white"
              style={shadows.card}>
              <View className="bg-[#DBEAFE] px-3.5 py-3">
                <Text className="text-[15px] font-bold text-[#1D4ED8]">
                  Seller countered
                </Text>
                <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal">
                  They want {formatPrice(ownBid.counterAmount ?? ownBid.amount, currentListing.currency)}.
                  {ownBid.counterAmount != null
                    ? ` Your offer was ${formatPrice(ownBid.amount, currentListing.currency)}.`
                    : ''}
                </Text>
              </View>
              <View className="flex-row gap-2 px-3.5 py-3">
                <Text className="text-[13px] leading-4 text-brand-gray">
                  Accept, counter, or decline from the bar below.
                </Text>
              </View>
            </View>
          ) : null}

          {!isSeller && isActive && ownBid && ownBidStatus === 'PENDING' ? (
            <View className="mt-4">
              <View className="rounded-2xl border border-slate-200 bg-white px-3.5 py-3">
                <Text className="text-[15px] font-bold text-brand-black">
                  Waiting for the seller
                </Text>
                <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal">
                  Your offer is {formatPrice(ownBid.amount, currentListing.currency)}.
                </Text>
              </View>
            </View>
          ) : null}

          {!isSeller && isActive && ownBidStatus === 'ACCEPTED' && ownBid ? (
            <View className="mt-4 rounded-2xl bg-[#D1FAE5] px-3.5 py-3">
              <Text className="text-[15px] font-bold text-[#047857]">Offer accepted</Text>
              <Text className="mt-0.5 text-[13px] leading-4 text-brand-charcoal">
                Chat with the seller on WhatsApp to arrange the meetup.
              </Text>
            </View>
          ) : null}

          {!isSeller && isActive && (!ownBid || ['REJECTED', 'EXPIRED'].includes(ownBidStatus)) ? (
            <View className="mt-4" />
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
              hubLocation={formatPlace(
                currentListing.location,
                currentListing.city ?? selectedHub?.city,
              ) || selectedHub?.neighborhood}
            />
          </View>

          <Text className="mb-2 mt-5 text-[17px] font-bold text-brand-black">
            Offers ({bids.length})
          </Text>
          {bids.length === 0 ? (
            <Text className="py-6 text-center text-sm text-brand-gray">No bids yet</Text>
          ) : (
            bids.map(bid => (
              <BidCard
                key={bid.id}
                bid={bid}
                isSeller={!!isSeller}
                isOwnBid={bid.buyerId === user?.id}
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
      {!isSeller && isActive ? (
        <View
          className="border-t border-slate-200 bg-white px-4 pt-3"
          style={{paddingBottom: Math.max(insets.bottom, 12)}}>
          {ownBid && ownBidStatus === 'COUNTERED' ? (
            <View className="gap-2">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => void handleAccept(ownBid.id)}
                  className="flex-1 items-center rounded-xl bg-brand-black py-3.5">
                  <Text className="text-[15px] font-semibold text-white">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => openBuyerRecounter(ownBid)}
                  className="flex-1 items-center rounded-xl border border-brand-blue py-3.5">
                  <Text className="text-[15px] font-semibold text-brand-blue">Counter</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => handleReject(ownBid.id)} className="items-center py-1">
                <Text className="text-[14px] font-semibold text-brand-danger">Decline</Text>
              </TouchableOpacity>
            </View>
          ) : ownBid && ownBidStatus === 'PENDING' ? (
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('SubmitBid', {
                  listingId: currentListing.id,
                  listingTitle: currentListing.title,
                  minBid: currentListing.minBidPrice,
                  startingPrice: currentListing.askingPrice,
                  currency: currentListing.currency,
                  bidId: ownBid.id,
                  currentAmount: ownBid.amount,
                })
              }
              className="items-center rounded-xl border border-brand-blue bg-white py-3.5">
              <Text className="text-[15px] font-semibold text-brand-blue">Update offer</Text>
            </TouchableOpacity>
          ) : ownBidStatus === 'ACCEPTED' && ownBid ? (
            <TouchableOpacity
              onPress={() => void handleWhatsApp(ownBid)}
              className="items-center rounded-xl py-3.5"
              style={{backgroundColor: '#25D366'}}>
              <Text className="text-[15px] font-semibold text-white">Chat on WhatsApp</Text>
            </TouchableOpacity>
          ) : (
            <View>
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
                    currency: currentListing.currency,
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
          )}
        </View>
      ) : null}
      </View>
      <Modal
        visible={reportOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReportOpen(false)}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable className="flex-1 bg-black/40" onPress={() => setReportOpen(false)} />
          <View
            className="rounded-t-2xl bg-white px-4 pt-4"
            style={{
              paddingBottom:
                Math.max(insets.bottom, 16) +
                (Platform.OS === 'ios' ? 0 : keyboardHeight),
            }}>
            <Text className="text-[18px] font-bold text-brand-black">Report listing</Text>
            <Text className="mt-1 text-[13px] text-brand-gray">
              Tell us why this listing should be reviewed (at least 8 characters).
            </Text>
            <TextInput
              className="mt-3 min-h-[96px] rounded-xl border border-slate-200 bg-brand-white px-3 py-3 text-base text-brand-black"
              placeholder="Describe the issue"
              placeholderTextColor="#64748B"
              value={reportReason}
              onChangeText={setReportReason}
              multiline
              textAlignVertical="top"
              autoFocus
            />
            <TouchableOpacity
              onPress={() => void submitReport()}
              disabled={reporting}
              className="mt-3 items-center rounded-xl bg-brand-danger py-3.5">
              <Text className="text-[15px] font-semibold text-white">
                {reporting ? 'Sending...' : 'Submit report'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setReportOpen(false)} className="mt-2 items-center py-2">
              <Text className="text-[14px] font-semibold text-brand-charcoal">Close</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AppShell>
  );
};
