export type IdentityStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';

export type IdKind =
  | 'NATIONAL_ID'
  | 'PASSPORT'
  | 'DRIVERS_LICENSE'
  | 'VOTERS_CARD';

export interface Identity {
  status: IdentityStatus;
  idKind: IdKind | null;
  idFrontUrl: string | null;
  idBackUrl: string | null;
  selfieUrl: string | null;
  rejectionReason: string | null;
  listingCap: number;
}

export interface SubmitIdentityPayload {
  idKind: IdKind;
  idFrontUrl: string;
  selfieUrl: string;
  idBackUrl?: string;
  fullNameOnId?: string;
}
