type Raw = Record<string, any>;

function asRecord(value: unknown): Raw {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Raw)
    : {};
}

export function pickString(...values: unknown[]): string | null {
  for (const value of values) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

export function pickNumber(...values: unknown[]): number | null {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

export function extractList<T = Raw>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const raw = asRecord(data);
  const list = raw.items ?? raw.data ?? raw.listings ?? raw.bids ?? raw.notifications;
  return Array.isArray(list) ? (list as T[]) : [];
}

export function extractTokens(data: unknown): {
  accessToken: string;
  refreshToken: string;
  user: Raw;
} {
  const raw = asRecord(data);
  const nested = asRecord(raw.data);
  const accessToken =
    pickString(raw.accessToken, raw.access_token, nested.accessToken, nested.access_token) ??
    '';
  const refreshToken =
    pickString(
      raw.refreshToken,
      raw.refresh_token,
      nested.refreshToken,
      nested.refresh_token,
    ) ?? '';
  return {
    accessToken,
    refreshToken,
    user: asRecord(raw.user ?? nested.user ?? raw),
  };
}

export function extractWhatsAppUrl(data: unknown): string | null {
  const raw = asRecord(data);
  return pickString(raw.whatsappUrl, raw.whatsapp_url, asRecord(raw.data).whatsappUrl);
}

export function listingImageUrl(listing: {
  images?: Array<string | {url?: string; publicUrl?: string; cloudinary_url?: string}>;
}): string | undefined {
  const first = listing.images?.[0];
  if (!first) return undefined;
  if (typeof first === 'string') return first;
  return first.url ?? first.publicUrl ?? first.cloudinary_url;
}

export function listingImageUrls(listing: {
  images?: Array<string | {url?: string; publicUrl?: string; cloudinary_url?: string}>;
}): string[] {
  return (listing.images ?? [])
    .map(img => (typeof img === 'string' ? img : img.url ?? img.publicUrl ?? img.cloudinary_url))
    .filter((url): url is string => !!url);
}
