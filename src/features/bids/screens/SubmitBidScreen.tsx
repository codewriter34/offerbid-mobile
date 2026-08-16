import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {RootStackScreenProps} from '@app/navigation/types';
import {useBids} from '@features/bids/useBids';
import {isValidBidAmount} from '@shared/lib/validators';
import {formatPrice} from '@shared/lib/formatters';
import {AmountInput} from '@features/bids/components/AmountInput';
import {Button} from '@shared/ui/Button';

type Props = RootStackScreenProps<'SubmitBid'>;

export const SubmitBidScreen: React.FC<Props> = ({route, navigation}) => {
  const {listingId, listingTitle, minBid, startingPrice, bidId, currentAmount} =
    route.params;
  const isUpdate = Boolean(bidId);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const {submitBid} = useBids();
  const [amount, setAmount] = useState(
    currentAmount != null ? String(currentAmount) : '',
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (keyboardHeight > 0) {
      const id = setTimeout(() => {
        scrollRef.current?.scrollToEnd({animated: true});
      }, 60);
      return () => clearTimeout(id);
    }
  }, [keyboardHeight]);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    if (!isValidBidAmount(numAmount, minBid)) {
      setError(`Bid must be at least ${formatPrice(minBid)}`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitBid({listingId, offerAmount: numAmount});
      Alert.alert(
        isUpdate ? 'Offer Updated' : 'Bid Submitted',
        isUpdate
          ? 'Your offer has been updated.'
          : 'Your offer has been sent to the seller!',
        [{text: 'OK', onPress: () => navigation.goBack()}],
      );
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View
        className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3"
        style={{paddingTop: insets.top + 10}}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text className="text-base font-semibold text-brand-danger">Cancel</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-brand-black">
          {isUpdate ? 'Manage Bid' : 'Make an Offer'}
        </Text>
        <View className="w-14" />
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16}}>
          <Text className="text-[20px] font-bold leading-6 text-brand-black" numberOfLines={2}>
            {listingTitle}
          </Text>

          <View className="mt-5 rounded-xl bg-brand-white px-4 py-3">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm text-brand-charcoal">Asking price</Text>
              <Text className="text-base font-semibold text-brand-black">
                {formatPrice(startingPrice)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm text-brand-charcoal">Minimum bid</Text>
              <Text className="text-base font-semibold text-brand-black">
                {formatPrice(minBid)}
              </Text>
            </View>
            {isUpdate && currentAmount != null ? (
              <View className="mt-2 flex-row items-center justify-between">
                <Text className="text-sm text-brand-charcoal">Current offer</Text>
                <Text className="text-base font-semibold text-brand-black">
                  {formatPrice(currentAmount)}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="mb-2 mt-6 text-sm font-semibold text-brand-black">
            Your offer
          </Text>
          <AmountInput
            value={amount}
            onChangeText={text => {
              setAmount(text);
              setError(null);
            }}
            error={Boolean(error)}
            placeholder="Enter amount"
          />
          {error ? (
            <Text className="mt-2 text-center text-xs text-brand-danger">{error}</Text>
          ) : (
            <Text className="mt-2 text-center text-xs text-brand-gray">
              Must be at least {formatPrice(minBid)}
            </Text>
          )}
        </ScrollView>

        <View
          className="border-t border-slate-100 bg-white px-5 pt-3"
          style={{
            paddingBottom:
              Math.max(insets.bottom, 12) + (Platform.OS === 'ios' ? 0 : keyboardHeight),
          }}>
          <Button
            title={isUpdate ? 'Update Offer' : 'Submit Offer'}
            onPress={handleSubmit}
            variant="primary"
            size="lg"
            fullWidth
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
