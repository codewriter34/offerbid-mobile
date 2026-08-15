import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import {RootStackScreenProps} from '../../types/navigation';
import {useBids} from '../../hooks/useBids';
import {formatPrice} from '../../utils/formatters';
import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'CounterBid'>;

export const CounterBidScreen: React.FC<Props> = ({route, navigation}) => {
  const {bidId, currentAmount, listingTitle} = route.params;
  const {respondToBid} = useBids();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Counter Offer</Text>
        <View style={{width: 50}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listingTitle}
        </Text>
        <Text style={styles.currentLabel}>
          Current bid: {formatPrice(currentAmount)}
        </Text>

        <Text style={styles.inputLabel}>Your counter amount</Text>
        <TextInput
          style={styles.amountInput}
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          placeholder="Enter amount"
          placeholderTextColor={colors.text.light}
          autoFocus
        />

        <Button
          title="Send Counter"
          onPress={handleSubmit}
          variant="secondary"
          size="lg"
          fullWidth
          loading={submitting}
          style={styles.submitBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.white},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    paddingTop: spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cancelText: {...typography.body, color: colors.error},
  headerTitle: {...typography.h3, color: colors.text.primary},
  content: {padding: spacing.xl, flex: 1},
  listingTitle: {...typography.h2, color: colors.text.primary, marginBottom: spacing.sm},
  currentLabel: {
    ...typography.body,
    color: colors.text.secondary,
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  amountInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...typography.price,
    fontSize: 28,
    color: colors.text.primary,
    textAlign: 'center',
  },
  submitBtn: {marginTop: spacing.xl},
});
