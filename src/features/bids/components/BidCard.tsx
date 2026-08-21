import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Bid, BidStatus} from '@shared/types';
import {formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {CountdownTimer} from '@shared/ui/CountdownTimer';
import {AvatarImage} from '@shared/ui/CachedImage';

interface BidCardProps {
  bid: Bid;
  isSeller: boolean;
  isOwnBid?: boolean;
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
  isOwnBid = false,
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
  const currency = bid.currency ?? 'XAF';
  const personName = isSeller
    ? bid.buyerName?.trim() || 'Buyer'
    : 'You';
  const amountLabel = isCountered
    ? isSeller
      ? 'Your counter'
      : 'Seller counter'
    : isSeller
      ? 'Offer'
      : 'Your offer';

  const showSellerActions = status === 'PENDING' && isSeller;
  const showBuyerCounterActions = isCountered && !isSeller && isOwnBid;
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
        <View className="flex-row items-start gap-3">
          <AvatarImage uri={isSeller ? bid.buyerAvatarUrl : null} name={personName} size={40} />
          <View className="min-w-0 flex-1">
            <View className="flex-row items-start justify-between gap-3">
              <Text
                className="min-w-0 flex-1 text-[16px] font-semibold leading-5 text-brand-black"
                numberOfLines={2}>
                {personName}
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
              {formatPrice(displayAmount, currency)}
            </Text>
            {isCountered && bid.counterAmount != null ? (
              <Text className="mt-0.5 text-sm text-brand-charcoal">
                Original offer {formatPrice(bid.amount, currency)}
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
          </View>
        </View>
      </TouchableOpacity>

      {hasActions ? (
        <View className="border-t border-slate-100 px-4 py-3">
          {showSellerActions || showBuyerCounterActions ? (
            <View className="gap-2">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  disabled={disabled}
                  onPress={() => onAccept?.(bid.id)}
                  className="flex-1 items-center rounded-xl bg-brand-black py-2.5">
                  <Text className="text-[13px] font-semibold text-white">Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={disabled}
                  onPress={() => onCounter?.(bid.id)}
                  className="flex-1 items-center rounded-xl border border-brand-blue py-2.5">
                  <Text className="text-[13px] font-semibold text-brand-blue">Counter</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                disabled={disabled}
                onPress={() => onReject?.(bid.id)}
                className="items-center py-1">
                <Text className="text-[13px] font-semibold text-brand-danger">
                  {showBuyerCounterActions ? 'Decline' : 'Reject'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
          {showWhatsApp ? (
            <TouchableOpacity
              onPress={() => onWhatsApp?.(bid)}
              className="items-center rounded-xl py-2.5"
              style={{backgroundColor: '#25D366'}}>
              <Text className="text-[13px] font-semibold text-white">Chat on WhatsApp</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};
