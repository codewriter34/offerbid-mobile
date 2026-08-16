import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Bid, BidStatus} from '@shared/types';
import {formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {Button} from '@shared/ui/Button';
import {CountdownTimer} from '@shared/ui/CountdownTimer';

interface BidCardProps {
  bid: Bid;
  isSeller: boolean;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onCounter?: (id: string) => void;
  onWhatsApp?: (bid: Bid) => void;
  onPress?: (bid: Bid) => void;
  disabled?: boolean;
}

const STATUS_CHIP: Record<string, {bg: string; fg: string; label: string}> = {
  PENDING: {bg: '#FEF3C7', fg: '#B45309', label: 'Pending'},
  ACCEPTED: {bg: '#D1FAE5', fg: '#047857', label: 'Accepted'},
  REJECTED: {bg: '#FEE2E2', fg: '#B91C1C', label: 'Rejected'},
  COUNTERED: {bg: '#DBEAFE', fg: '#1D4ED8', label: 'Countered'},
  EXPIRED: {bg: '#F1F5F9', fg: '#64748B', label: 'Expired'},
};

export const BidCard: React.FC<BidCardProps> = ({
  bid,
  isSeller,
  onAccept,
  onReject,
  onCounter,
  onWhatsApp,
  onPress,
  disabled = false,
}) => {
  const status = String(bid.status).toUpperCase() as BidStatus;
  const chip = STATUS_CHIP[status] ?? STATUS_CHIP.EXPIRED;
  const isCountered = status === 'COUNTERED';
  const displayAmount =
    bid.counterAmount && isCountered ? bid.counterAmount : bid.amount;
  const amountLabel = isCountered
    ? isSeller
      ? 'Your counter'
      : 'Seller counter'
    : isSeller
      ? 'Offer'
      : 'Your offer';

  const showSellerActions = status === 'PENDING' && isSeller;
  const showBuyerCounterActions = isCountered && !isSeller;
  const showWhatsApp = status === 'ACCEPTED' && onWhatsApp;
  const hasActions = showSellerActions || showBuyerCounterActions || showWhatsApp;

  return (
    <View
      className="mb-3 overflow-hidden rounded-xl border border-slate-200 bg-white"
      style={{borderLeftWidth: 4, borderLeftColor: chip.fg}}>
      <TouchableOpacity
        activeOpacity={onPress ? 0.7 : 1}
        onPress={onPress ? () => onPress(bid) : undefined}
        disabled={!onPress}
        className="px-4 pb-3 pt-3.5">
        <View className="flex-row items-start justify-between gap-3">
          <Text
            className="min-w-0 flex-1 text-[16px] font-semibold leading-5 text-brand-black"
            numberOfLines={2}>
            {bid.listingTitle ?? 'Listing'}
          </Text>
          <View className="rounded-full px-2.5 py-1" style={{backgroundColor: chip.bg}}>
            <Text className="text-[11px] font-bold" style={{color: chip.fg}}>
              {chip.label}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
          {amountLabel}
        </Text>
        <Text className="text-[22px] font-bold text-brand-black">
          {formatPrice(displayAmount)}
        </Text>
        {isCountered && bid.counterAmount != null ? (
          <Text className="mt-0.5 text-sm text-brand-charcoal">
            Original offer {formatPrice(bid.amount)}
          </Text>
        ) : null}

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-xs text-brand-gray">
            {formatRelativeTime(bid.createdAt)}
          </Text>
          {status === 'PENDING' && bid.expiresAt ? (
            <View className="flex-row items-center">
              <Text className="text-xs text-brand-gray">Expires </Text>
              <CountdownTimer expiresAt={bid.expiresAt} />
            </View>
          ) : null}
        </View>
      </TouchableOpacity>

      {hasActions ? (
        <View className="flex-row gap-2 border-t border-slate-100 px-4 py-3">
          {showSellerActions ? (
            <>
              <Button
                title="Accept"
                variant="secondary"
                size="sm"
                onPress={() => onAccept?.(bid.id)}
                disabled={disabled}
                style={{flex: 1}}
              />
              <Button
                title="Counter"
                variant="outline"
                size="sm"
                onPress={() => onCounter?.(bid.id)}
                disabled={disabled}
                style={{flex: 1}}
              />
              <Button
                title="Reject"
                variant="danger"
                size="sm"
                onPress={() => onReject?.(bid.id)}
                disabled={disabled}
                style={{flex: 1}}
              />
            </>
          ) : null}
          {showBuyerCounterActions ? (
            <>
              <Button
                title="Accept counter"
                variant="secondary"
                size="sm"
                onPress={() => onAccept?.(bid.id)}
                disabled={disabled}
                style={{flex: 1}}
              />
              <Button
                title="Decline"
                variant="danger"
                size="sm"
                onPress={() => onReject?.(bid.id)}
                disabled={disabled}
                style={{flex: 1}}
              />
            </>
          ) : null}
          {showWhatsApp ? (
            <Button
              title="Chat on WhatsApp"
              variant="secondary"
              size="sm"
              onPress={() => onWhatsApp?.(bid)}
              style={{flex: 1, backgroundColor: '#25D366'}}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
