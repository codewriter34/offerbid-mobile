export interface SponsoredAd {
  id: string;
  sponsored: true;
  slot: string;
  advertiserName: string | null;
  title: string;
  body: string | null;
  ctaLabel: string;
  destinationUrl: string;
  imageUrl: string | null;
  placement: string | null;
  country: string | null;
  city: string | null;
}
