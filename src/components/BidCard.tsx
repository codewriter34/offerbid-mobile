import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Bid, BidStatus} from '../types';
import {colors} from '../theme/colors';
import {typography} from '../theme/typography';
import {spacing, borderRadius} from '../theme/spacing';
import {formatPrice, formatRelativeTime} from '../utils/formatters';
import {Button} from './Button';
import {CountdownTimer} from './CountdownTimer';

interface BidCardProps {
  bid: Bid;
  isSeller: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCounter?: (id: string) => void;
  onWhatsApp?: (bid: Bid) => void;
  disabled?: boolean;
}

const STATUS_COLORS: Record<BidStatus, string> = {
  pending: colors.warning,
  accepted: colors.success,
  rejected: colors.error,
  countered: colors.gradientStart,
  expired: colors.text.light,
};

const STATUS_LABELS: Record<BidStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  rejected: 'Rejected',
  countered: 'Countered',
  expired: 'Expired',
};

export const BidCard: React.FC<BidCardProps> = ({
  bid,
  isSeller,
  onAccept,
  onReject,
  onCounter,
  onWhatsApp,
  disabled = false,
}) => {
  const statusColor = STATUS_COLORS[bid.status];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{formatPrice(bid.amount)}</Text>
          <View style={[styles.statusBadge, {backgroundColor: statusColor}]}>
            <Text style={styles.statusText}>{STATUS_LABELS[bid.status]}</Text>
          </View>
        </View>
        <Text style={styles.time}>{formatRelativeTime(bid.created_at)}</Text>
      </View>

      {bid.status === 'pending' && bid.expires_at && (
        <View style={styles.timerRow}>
          <Text style={styles.timerLabel}>Expires in:</Text>
          <CountdownTimer expiresAt={bid.expires_at} />
        </View>
      )}

      {bid.status === 'pending' && isSeller && (
        <View style={styles.actions}>
          <Button
            title="Accept"
            variant="secondary"
            size="sm"
            onPress={() => onAccept?.(bid.id)}
            disabled={disabled}
            style={styles.actionBtn}
          />
          <Button
            title="Counter"
            variant="outline"
            size="sm"
            onPress={() => onCounter?.(bid.id)}
            disabled={disabled}
            style={styles.actionBtn}
          />
          <Button
            title="Reject"
            variant="danger"
            size="sm"
            onPress={() => onReject?.(bid.id)}
            disabled={disabled}
            style={styles.actionBtn}
          />
        </View>
      )}

      {bid.status === 'accepted' && onWhatsApp && (
        <Button
          title="Chat on WhatsApp"
          variant="secondary"
          size="sm"
          onPress={() => onWhatsApp(bid)}
          style={styles.whatsappBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  amount: {
    ...typography.price,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    ...typography.caption,
    color: colors.white,
    fontWeight: '600',
  },
  time: {
    ...typography.caption,
    color: colors.text.light,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  timerLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  whatsappBtn: {
    marginTop: spacing.md,
    backgroundColor: '#25D366',
  },
});
