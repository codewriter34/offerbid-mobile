import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Bid, BidStatus} from '@shared/types';
import {expiryProgress, formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {CountdownTimer} from '@shared/ui/CountdownTimer';
import {CachedImage} from '@shared/ui/CachedImage';
import {shadows} from '@shared/theme/shadows';

const STATUS_CHIP: Record<string, {bg: string; fg: string; label: string}> = {
  PENDING: {bg: '#FEF3C7', fg: '#B45309', label: 'Pending'},
  ACCEPTED: {bg: '#D1FAE5', fg: '#047857', label: 'Accepted'},
  REJECTED: {bg: '#FEE2E2', fg: '#B91C1C', label: 'Rejected'},
  COUNTERED: {bg: '#DBEAFE', fg: '#1D4ED8', label: 'Countered'},
  EXPIRED: {bg: '#F1F5F9', fg: '#64748B', label: 'Expired'},
};

export function MyBidCard({
  bid,
  onView,
  onManage,
  onAcceptCounter,
  onDeclineCounter,
  onRecounter,
  onWhatsApp,
}: {
  bid: Bid;
  onView: (bid: Bid) => void;
  onManage: (bid: Bid) => void;
  onAcceptCounter?: (id: string) => void;
  onDeclineCounter?: (id: string) => void;
  onRecounter?: (bid: Bid) => void;
  onWhatsApp?: (bid: Bid) => void;
}) {
  const status = String(bid.status).toUpperCase() as BidStatus;
  const chip = STATUS_CHIP[status] ?? STATUS_CHIP.EXPIRED;
  const isPending = status === 'PENDING';
  const isCountered = status === 'COUNTERED';
  const isAccepted = status === 'ACCEPTED';
  const displayAmount =
    bid.counterAmount && isCountered ? bid.counterAmount : bid.amount;
  const progress = expiryProgress(bid.createdAt, bid.expiresAt);
  const currency = bid.currency ?? 'XAF';

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={[{borderLeftWidth: 4, borderLeftColor: chip.fg}, shadows.card]}>
      <View className="flex-row px-3.5 pb-3 pt-3.5">
        {bid.listingImageUrl ? (
          <View className="h-[72px] w-[72px] overflow-hidden rounded-xl bg-slate-100">
            <CachedImage
              source={bid.listingImageUrl}
              className="h-full w-full"
              contentFit="cover"
              recyclingKey={bid.id}
            />
          </View>
        ) : (
          <View className="h-[72px] w-[72px] items-center justify-center rounded-xl bg-slate-100">
            <Text className="text-xs font-semibold text-brand-gray">No photo</Text>
          </View>
        )}

        <View className="ml-3 min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="min-w-0 flex-1 text-[16px] font-bold leading-5 text-brand-black"
              numberOfLines={2}>
              {bid.listingTitle ?? 'Listing'}
            </Text>
            <View className="rounded-full px-2.5 py-1" style={{backgroundColor: chip.bg}}>
              <Text className="text-[11px] font-bold" style={{color: chip.fg}}>
                {chip.label}
              </Text>
            </View>
          </View>
          {bid.listingCategory ? (
            <Text className="mt-0.5 text-[12px] text-brand-gray" numberOfLines={1}>
              {bid.listingCategory}
            </Text>
          ) : null}
        </View>
      </View>

      <View className="flex-row px-3.5 pb-3">
        <View className="flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            {isCountered ? 'Seller counter' : 'Your offer'}
          </Text>
          <Text className="mt-0.5 text-[20px] font-bold text-brand-black">
            {formatPrice(displayAmount, currency)}
          </Text>
          {isCountered && bid.counterAmount != null ? (
            <Text className="mt-0.5 text-xs text-brand-charcoal">
              Your offer {formatPrice(bid.amount, currency)}
            </Text>
          ) : null}
        </View>

        {isPending && bid.expiresAt ? (
          <View className="flex-1 items-end">
            <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
              Expires in
            </Text>
            <CountdownTimer expiresAt={bid.expiresAt} />
            <View className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <View
                className="h-full rounded-full bg-brand-blue"
                style={{width: `${Math.max(6, progress * 100)}%`}}
              />
            </View>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between border-t border-slate-100 px-3.5 py-2.5">
        <Text className="text-xs text-brand-gray">{formatRelativeTime(bid.createdAt)}</Text>
      </View>

      <View className="flex-row gap-2 border-t border-slate-100 px-3.5 py-3">
        <TouchableOpacity
          onPress={() => onView(bid)}
          className="flex-1 items-center rounded-xl border border-brand-blue py-2.5">
          <Text className="text-[13px] font-semibold text-brand-blue">View Item</Text>
        </TouchableOpacity>

        {isPending ? (
          <TouchableOpacity
            onPress={() => onManage(bid)}
            className="flex-1 items-center rounded-xl bg-brand-blue py-2.5">
            <Text className="text-[13px] font-semibold text-white">Manage Bid</Text>
          </TouchableOpacity>
        ) : null}

        {isCountered ? (
          <>
            <TouchableOpacity
              onPress={() => onAcceptCounter?.(bid.id)}
              className="flex-1 items-center rounded-xl bg-brand-black py-2.5">
              <Text className="text-[13px] font-semibold text-white">Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRecounter?.(bid)}
              className="flex-1 items-center rounded-xl border border-brand-blue py-2.5">
              <Text className="text-[13px] font-semibold text-brand-blue">Counter</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDeclineCounter?.(bid.id)}
              className="flex-1 items-center rounded-xl bg-brand-danger py-2.5">
              <Text className="text-[13px] font-semibold text-white">Decline</Text>
            </TouchableOpacity>
          </>
        ) : null}

        {isAccepted && onWhatsApp ? (
          <TouchableOpacity
            onPress={() => onWhatsApp(bid)}
            className="flex-1 items-center rounded-xl py-2.5"
            style={{backgroundColor: '#25D366'}}>
            <Text className="text-[13px] font-semibold text-white">WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
