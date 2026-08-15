export type BidStatus = 'pending' | 'accepted' | 'rejected' | 'countered' | 'expired';

export interface Bid {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount: number;
  status: BidStatus;
  parent_bid_id: string | null;
  expires_at: string;
  created_at: string;
}

export interface CreateBidPayload {
  listing_id: string;
  amount: number;
}

export interface UpdateBidPayload {
  status: 'accepted' | 'rejected' | 'countered';
  counter_amount?: number;
}
