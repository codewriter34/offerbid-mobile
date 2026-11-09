import React from 'react';
import {View, Text, TouchableOpacity} from 'react-native';
import {Bid, BidStatus} from '@shared/types';
import {expiryProgress, formatPrice, formatRelativeTime} from '@shared/lib/formatters';
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
  const progress = expiryProgress(bid.createdAt, bid.expiresAt);
  const currency = bid.currency ?? 'XAF';

  return (
    <View
      className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white"
      style={[{borderLeftWidth: 4, borderLeftColor: chip.fg}, shadows.card]}>
      <TouchableOpacity
        onPress={() => onView(bid)}
        activeOpacity={0.75}
        className="flex-row px-3.5 pb-3 pt-3.5"
        accessibilityRole="button"
        accessibilityLabel={`View ${bid.listingTitle ?? 'listing'}`}>
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
          {bid.listingCategory ? (
            <Text className="mt-0.5 text-[12px] text-brand-gray" numberOfLines={1}>
              {bid.listingCategory}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>

      <View className="flex-row px-3.5 pb-3">
        <PriceCol
          label="Listing"
          value={bid.askingPrice != null ? formatPrice(bid.askingPrice, currency) : '—'}
          muted={bid.askingPrice == null}
        />
        <PriceCol
          label="Your offer"
          value={formatPrice(bid.amount, currency)}
          emphasis={!isCountered}
        />
        {isCountered && bid.counterAmount != null ? (
          <PriceCol
            label="Counter"
            value={formatPrice(bid.counterAmount, currency)}
            emphasis
          />
        ) : isPending && bid.expiresAt ? (
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
        ) : (
          <View className="flex-1" />
        )}
      </View>

      <View className="flex-row items-center justify-between border-t border-slate-100 px-3.5 py-2.5">
        <Text className="text-xs text-brand-gray">{formatRelativeTime(bid.createdAt)}</Text>
      </View>

      {isPending ? (
        <View className="border-t border-slate-100 px-3.5 py-3">
          <TouchableOpacity
            onPress={() => onManage(bid)}
            className="items-center rounded-xl bg-brand-blue py-2.5">
            <Text className="text-[13px] font-semibold text-white">Update offer</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isCountered ? (
        <View className="gap-2 border-t border-slate-100 px-3.5 py-3">
          <View className="flex-row gap-2">
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
          </View>
          <TouchableOpacity onPress={() => onDeclineCounter?.(bid.id)} className="items-center py-1">
            <Text className="text-[13px] font-semibold text-brand-danger">Decline</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {isAccepted && onWhatsApp ? (
        <View className="border-t border-slate-100 px-3.5 py-3">
          <TouchableOpacity
            onPress={() => onWhatsApp(bid)}
            className="items-center rounded-xl py-2.5"
            style={{backgroundColor: '#25D366'}}>
            <Text className="text-[13px] font-semibold text-white">Chat on WhatsApp</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

function PriceCol({
  label,
  value,
  emphasis,
  muted,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  muted?: boolean;
}) {
  return (
    <View className="min-w-0 flex-1">
      <Text className="text-[11px] font-semibold uppercase tracking-wide text-brand-gray">
        {label}
      </Text>
      <Text
        className={`mt-0.5 font-bold ${
          muted ? 'text-brand-gray' : 'text-brand-black'
        } ${emphasis ? 'text-[17px]' : 'text-[15px]'}`}
        numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}
