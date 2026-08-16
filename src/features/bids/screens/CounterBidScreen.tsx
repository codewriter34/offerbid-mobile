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
import {formatPrice} from '@shared/lib/formatters';
import {AmountInput} from '@features/bids/components/AmountInput';
import {Button} from '@shared/ui/Button';

type Props = RootStackScreenProps<'CounterBid'>;

export const CounterBidScreen: React.FC<Props> = ({route, navigation}) => {
  const {bidId, currentAmount, listingTitle} = route.params;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const {respondToBid} = useBids();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
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

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid counter amount.');
      return;
    }

    setSubmitting(true);
    try {
      await respondToBid(bidId, {action: 'COUNTER', counterAmount: numAmount});
      Alert.alert('Counter Sent', 'Your counter offer has been sent.', [
        {text: 'OK', onPress: () => navigation.goBack()},
      ]);
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
        <Text className="text-lg font-bold text-brand-black">Counter Offer</Text>
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
          <Text className="mt-2 text-base text-brand-charcoal">
            Current bid: {formatPrice(currentAmount)}
          </Text>

          <Text className="mb-2 mt-6 text-sm font-semibold text-brand-black">
            Your counter amount
          </Text>
          <AmountInput
            value={amount}
            onChangeText={setAmount}
            placeholder="Enter amount"
          />
        </ScrollView>

        <View
          className="border-t border-slate-100 bg-white px-5 pt-3"
          style={{
            paddingBottom:
              Math.max(insets.bottom, 12) + (Platform.OS === 'ios' ? 0 : keyboardHeight),
          }}>
          <Button
            title="Send Counter"
            onPress={handleSubmit}
            variant="secondary"
            size="lg"
            fullWidth
            loading={submitting}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};
