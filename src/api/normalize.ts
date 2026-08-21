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

const IMAGE_URL_KEYS = [
  'url',
  'publicUrl',
  'public_url',
  'secure_url',
  'cloudinary_url',
  'imageUrl',
  'image_url',
  'listingImageUrl',
  'listing_image_url',
  'thumbnailUrl',
  'thumbnail_url',
  'thumbUrl',
  'coverUrl',
  'cover_url',
  'photoUrl',
  'photo_url',
  'fileUrl',
  'file_url',
  'signedUrl',
  'signed_url',
  'src',
  'uri',
] as const;

const IMAGE_NESTED_KEYS = [
  'image',
  'cover',
  'coverImage',
  'thumbnail',
  'thumb',
  'photo',
  'file',
  'asset',
  'media',
  'primaryImage',
] as const;

const IMAGE_ARRAY_KEYS = ['images', 'imageUrls', 'photos', 'media', 'files'] as const;

function isMediaUrl(value: string): boolean {
  const url = value.trim();
  if (!url) return false;
  if (
    url.startsWith('file:') ||
    url.startsWith('content:') ||
    url.startsWith('data:') ||
    url.startsWith('ph://') ||
    url.startsWith('assets-library:')
  ) {
    return true;
  }
  if (url.startsWith('//')) return true;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    if (/\/api\/v\d+\//.test(url) && !/\/(uploads|media|images)\//.test(url)) {
      return false;
    }
    return true;
  }
  return false;
}

export function normalizeMediaUrl(value: string): string {
  const url = value.trim();
  if (url.startsWith('//')) return `https:${url}`;
  return url;
}

export function extractImageUrl(value: unknown, depth = 0): string | undefined {
  if (depth > 4 || value == null) return undefined;
  if (typeof value === 'string') {
    return isMediaUrl(value) ? normalizeMediaUrl(value) : undefined;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractImageUrl(item, depth + 1);
      if (url) return url;
    }
    return undefined;
  }
  if (typeof value !== 'object') return undefined;
  const rec = value as Record<string, unknown>;
  for (const key of IMAGE_URL_KEYS) {
    const item = rec[key];
    if (typeof item === 'string' && isMediaUrl(item)) {
      return normalizeMediaUrl(item);
    }
  }
  for (const key of IMAGE_NESTED_KEYS) {
    if (key in rec) {
      const url = extractImageUrl(rec[key], depth + 1);
      if (url) return url;
    }
  }
  for (const key of IMAGE_ARRAY_KEYS) {
    if (key in rec) {
      const url = extractImageUrl(rec[key], depth + 1);
      if (url) return url;
    }
  }
  return undefined;
}

export function extractImageUrls(value: unknown): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (url?: string) => {
    if (!url || seen.has(url)) return;
    seen.add(url);
    urls.push(url);
  };

  if (Array.isArray(value)) {
    value.forEach(item => push(extractImageUrl(item)));
    return urls;
  }
  if (!value || typeof value !== 'object') {
    push(extractImageUrl(value));
    return urls;
  }
  const rec = value as Record<string, unknown>;
  for (const key of IMAGE_ARRAY_KEYS) {
    extractImageUrls(rec[key]).forEach(push);
  }
  for (const key of IMAGE_NESTED_KEYS) {
    if (Array.isArray(rec[key])) extractImageUrls(rec[key]).forEach(push);
    else push(extractImageUrl(rec[key]));
  }
  push(extractImageUrl(rec));
  return urls;
}

export function listingImageUrl(listing: unknown): string | undefined {
  return extractImageUrl(listing);
}

export function listingImageUrls(listing: unknown): string[] {
  const fromTree = extractImageUrls(listing);
  if (fromTree.length > 0) return fromTree;
  const url = extractImageUrl(listing);
  return url ? [url] : [];
}
