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
import {isValidBidAmount} from '../../utils/validators';
import {formatPrice} from '../../utils/formatters';
import {Button} from '../../components/Button';
import {colors} from '../../theme/colors';
import {typography} from '../../theme/typography';
import {spacing, borderRadius} from '../../theme/spacing';

type Props = RootStackScreenProps<'SubmitBid'>;

export const SubmitBidScreen: React.FC<Props> = ({route, navigation}) => {
  const {listingId, listingTitle, minBid, startingPrice} = route.params;
  const {submitBid} = useBids();
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);

    if (!isValidBidAmount(numAmount, minBid)) {
      setError(`Bid must be at least ${formatPrice(minBid)}`);
      return;
    }

    setError(null);
    setSubmitting(true);
    try {
      await submitBid({listing_id: listingId, amount: numAmount});
      Alert.alert('Bid Submitted', 'Your offer has been sent to the seller!', [
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
        <Text style={styles.headerTitle}>Make an Offer</Text>
        <View style={{width: 50}} />
      </View>

      <View style={styles.content}>
        <Text style={styles.listingTitle} numberOfLines={2}>
          {listingTitle}
        </Text>

        <View style={styles.priceInfo}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Asking price</Text>
            <Text style={styles.priceValue}>{formatPrice(startingPrice)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Minimum bid</Text>
            <Text style={styles.priceValue}>{formatPrice(minBid)}</Text>
          </View>
        </View>

        <Text style={styles.inputLabel}>Your offer</Text>
        <TextInput
          style={[styles.amountInput, error && styles.inputError]}
          value={amount}
          onChangeText={t => {
            setAmount(t);
            setError(null);
          }}
          keyboardType="numeric"
          placeholder="Enter your bid amount"
          placeholderTextColor={colors.text.light}
          autoFocus
        />
        {error && <Text style={styles.errorText}>{error}</Text>}

        <Button
          title="Submit Offer"
          onPress={handleSubmit}
          variant="primary"
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
  listingTitle: {...typography.h2, color: colors.text.primary, marginBottom: spacing.lg},
  priceInfo: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  priceLabel: {...typography.bodySmall, color: colors.text.secondary},
  priceValue: {...typography.body, fontWeight: '600', color: colors.text.primary},
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
  inputError: {borderColor: colors.error},
  errorText: {...typography.caption, color: colors.error, marginTop: spacing.sm, textAlign: 'center'},
  submitBtn: {marginTop: spacing.xl},
});
