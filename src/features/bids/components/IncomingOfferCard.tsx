import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Bid, BidStatus} from '@shared/types';
import {formatPrice, formatRelativeTime} from '@shared/lib/formatters';
import {CountdownTimer} from '@shared/ui/CountdownTimer';
import {MediaThumb} from '@shared/ui/CachedImage';
import {shadows} from '@shared/theme/shadows';

const STATUS_CHIP: Record<string, {bg: string; fg: string; label: string}> = {
  PENDING: {bg: '#FEF3C7', fg: '#B45309', label: 'Pending'},
  ACCEPTED: {bg: '#D1FAE5', fg: '#047857', label: 'Accepted'},
  REJECTED: {bg: '#FEE2E2', fg: '#B91C1C', label: 'Rejected'},
  COUNTERED: {bg: '#DBEAFE', fg: '#1D4ED8', label: 'Countered'},
  EXPIRED: {bg: '#F1F5F9', fg: '#64748B', label: 'Expired'},
};

export function IncomingOfferCard({
  bid,
  onView,
  onAccept,
  onReject,
  onCounter,
  onWhatsApp,
}: {
  bid: Bid;
  onView: (bid: Bid) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  onCounter: (id: string) => void;
  onWhatsApp?: (bid: Bid) => void;
}) {
  const status = String(bid.status).toUpperCase() as BidStatus;
  const chip = STATUS_CHIP[status] ?? STATUS_CHIP.EXPIRED;
  const isPending = status === 'PENDING';
  const isAccepted = status === 'ACCEPTED';
  const isCountered = status === 'COUNTERED';
  const currency = bid.currency ?? 'XAF';
  const buyerLabel = bid.buyerName?.trim() || 'A buyer';

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={[{borderLeftWidth: 4, borderLeftColor: chip.fg}, shadows.card]}>
      <TouchableOpacity
        onPress={() => onView(bid)}
        activeOpacity={0.75}
        className="flex-row px-3.5 pb-3 pt-3.5">
        <MediaThumb
          uri={bid.listingImageUrl}
          recyclingKey={bid.id}
          className="h-[72px] w-[72px] rounded-xl"
          iconSize={20}
        />
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
          <Text className="mt-0.5 text-[12px] text-brand-gray" numberOfLines={1}>
            {buyerLabel}
            {bid.listingCategory ? ` · ${bid.listingCategory}` : ''}
          </Text>
        </View>
      </TouchableOpacity>

      <View className="flex-row items-end justify-between px-3.5 pb-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            Listing
          </Text>
          <Text className="mt-0.5 text-[15px] font-bold text-brand-black" numberOfLines={1}>
            {bid.askingPrice != null ? formatPrice(bid.askingPrice, currency) : '—'}
          </Text>
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
            {isCountered && bid.counterAmount != null ? 'Your counter' : 'Offer'}
          </Text>
          <Text className="mt-0.5 text-[17px] font-bold text-brand-black" numberOfLines={1}>
            {formatPrice(
              isCountered && bid.counterAmount != null ? bid.counterAmount : bid.amount,
              currency,
            )}
          </Text>
          {isCountered && bid.counterAmount != null ? (
            <Text className="mt-0.5 text-xs text-brand-charcoal">
              Their offer {formatPrice(bid.amount, currency)}
            </Text>
          ) : null}
        </View>
        <View className="min-w-0 flex-1 items-end">
          <Text className="text-xs text-brand-gray">
            Received {formatRelativeTime(bid.createdAt)}
          </Text>
          {isPending && bid.expiresAt ? (
            <View className="mt-1 flex-row items-center">
              <Text className="text-xs text-brand-gray">Expires </Text>
              <CountdownTimer expiresAt={bid.expiresAt} />
            </View>
          ) : null}
        </View>
      </View>

      {isAccepted ? (
        <View className="mx-3.5 mb-3 rounded-xl bg-[#D1FAE5] px-3 py-2.5">
          <Text className="text-[12px] leading-4 text-brand-charcoal">
            You accepted this offer. Continue the chat with the buyer on WhatsApp.
          </Text>
        </View>
      ) : null}

      {isCountered ? (
        <View className="mx-3.5 mb-3 rounded-xl bg-[#DBEAFE] px-3 py-2.5">
          <Text className="text-[12px] leading-4 text-brand-charcoal">
            Counter sent. Waiting for {buyerLabel.toLowerCase()} to respond.
          </Text>
        </View>
      ) : null}

      <View className="border-t border-slate-100 px-3.5 py-3">
        {isPending ? (
          <View className="gap-2">
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={() => onAccept(bid.id)}
                className="flex-1 items-center rounded-xl bg-brand-blue py-2.5">
                <Text className="text-[13px] font-semibold text-white">Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onCounter(bid.id)}
                className="flex-1 items-center rounded-xl border border-brand-blue py-2.5">
                <Text className="text-[13px] font-semibold text-brand-blue">Counter</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => onReject(bid.id)} className="items-center py-1">
              <Text className="text-[13px] font-semibold text-brand-danger">Reject</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {isAccepted && onWhatsApp ? (
          <TouchableOpacity
            onPress={() => onWhatsApp(bid)}
            className="items-center rounded-xl py-2.5"
            style={{backgroundColor: '#25D366'}}>
            <Text className="text-[13px] font-semibold text-white">Chat on WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}
