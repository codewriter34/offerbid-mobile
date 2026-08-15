export type BidStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'COUNTERED'
  | 'EXPIRED';

export type BidAction = 'ACCEPT' | 'REJECT' | 'COUNTER';

export interface Bid {
  id: string;
  listingId: string;
  listingTitle?: string;
  buyerId: string;
  amount: number;
  status: BidStatus | string;
  parentBidId: string | null;
  counterAmount: number | null;
  expiresAt: string | null;
  createdAt: string;
  whatsappUrl: string | null;
}

export interface CreateBidPayload {
  listingId: string;
  offerAmount: number;
}

export interface RespondBidPayload {
  action: BidAction;
  counterAmount?: number;
}

export interface CounterRespondPayload {
  action: 'ACCEPT' | 'REJECT';
}
