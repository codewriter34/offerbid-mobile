import apiClient from '@api/client';
import {ENDPOINTS} from '@api/endpoints';
import {mapSponsoredAd} from '@api/mappers';
import {Hub, SponsoredAd, User} from '@shared/types';

export type AdCountry = 'CAMEROON' | 'NIGERIA';

export function adCountry(value: string | null | undefined): AdCountry | undefined {
  if (!value) return undefined;
  const compact = value.trim().toUpperCase().replace(/[^A-Z]/g, '');
  if (compact === 'CM' || compact === 'CMR' || compact.includes('CAMEROON')) {
    return 'CAMEROON';
  }
  if (compact === 'NG' || compact === 'NGA' || compact.includes('NIGERIA')) {
    return 'NIGERIA';
  }
  return undefined;
}

export function viewerAdParams(
  user: User | null,
  hub: Hub | null,
): {country?: AdCountry; city?: string} {
  const country = adCountry(hub?.country) ?? adCountry(user?.country);
  const city = (hub?.city || user?.city || '').split(',')[0].trim();
  return {
    ...(country ? {country} : {}),
    ...(city ? {city} : {}),
  };
}

function matchesViewer(
  ad: SponsoredAd,
  params: {country?: string; city?: string},
): boolean {
  const targetedCountry = ad.country ? adCountry(ad.country) : undefined;
  if (ad.country && !targetedCountry) return false;
  if (targetedCountry && targetedCountry !== params.country) return false;
  if (ad.city) {
    const viewerCity = params.city?.trim().toLowerCase();
    if (!viewerCity || ad.city.trim().toLowerCase() !== viewerCity) return false;
  }
  return true;
}

export async function fetchSponsoredFeedAd(params: {
  country?: string;
  city?: string;
}): Promise<SponsoredAd | null> {
  try {
    const query: Record<string, string> = {};
    if (params.country) query.country = params.country;
    if (params.city) query.city = params.city;
    const {data} = await apiClient.get(ENDPOINTS.ADS.FEED, {params: query});
    const body =
      data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
    const nested =
      body.data && typeof body.data === 'object' && !Array.isArray(body.data)
        ? (body.data as Record<string, unknown>)
        : {};
    const rawAd = 'ad' in body ? body.ad : nested.ad;
    if (rawAd == null) return null;
    const ad = mapSponsoredAd(rawAd);
    if (!ad || !matchesViewer(ad, params)) return null;
    return ad;
  } catch {
    return null;
  }
}
