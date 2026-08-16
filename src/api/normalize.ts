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
  const nested = asRecord(raw.data);
  return pickString(
    raw.whatsappUrl,
    raw.whatsapp_url,
    raw.whatsapp,
    nested.whatsappUrl,
    nested.whatsapp_url,
    nested.whatsapp,
  );
}

function imageFromUnknown(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) return value;
  if (!value || typeof value !== 'object') return undefined;
  const rec = value as Record<string, unknown>;
  for (const key of ['url', 'publicUrl', 'cloudinary_url', 'secure_url', 'src', 'uri']) {
    const item = rec[key];
    if (typeof item === 'string' && item.length > 0) return item;
  }
  return undefined;
}

export function listingImageUrl(listing: {
  images?: Array<string | {url?: string; publicUrl?: string; cloudinary_url?: string}>;
  imageUrls?: unknown;
  photos?: unknown;
  media?: unknown;
  image?: unknown;
  coverUrl?: unknown;
  thumbnail?: unknown;
}): string | undefined {
  const pools = [listing.images, listing.imageUrls, listing.photos, listing.media];
  for (const pool of pools) {
    if (!Array.isArray(pool) || pool.length === 0) continue;
    const url = imageFromUnknown(pool[0]);
    if (url) return url;
  }
  return (
    imageFromUnknown(listing.image) ??
    imageFromUnknown(listing.coverUrl) ??
    imageFromUnknown(listing.thumbnail)
  );
}

export function listingImageUrls(listing: {
  images?: Array<string | {url?: string; publicUrl?: string; cloudinary_url?: string}>;
}): string[] {
  return (listing.images ?? [])
    .map(img => (typeof img === 'string' ? img : img.url ?? img.publicUrl ?? img.cloudinary_url))
    .filter((url): url is string => !!url);
}
