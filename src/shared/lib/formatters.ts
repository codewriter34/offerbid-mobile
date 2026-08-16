const CURRENCY_MAP: Record<string, string> = {
  Cameroon: 'XAF',
  Nigeria: 'NGN',
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  XAF: 'FCFA',
  NGN: '₦',
};

export function formatPrice(amount: number, currency = 'XAF'): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

  if (currency === 'XAF') {
    return `${formatted} ${symbol}`;
  }
  return `${symbol}${formatted}`;
}

export function getCurrencyForCountry(country: string): string {
  return CURRENCY_MAP[country] ?? 'XAF';
}

const MINUTE = 60;
const HOUR = 3600;
const DAY = 86400;
const WEEK = 604800;
const MONTH = 2592000;

export function formatMemberSince(dateString: string): string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';
  return `Joined ${date.toLocaleDateString('en', {month: 'long', year: 'numeric'})}`;
}

export function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffSeconds = Math.floor((now - then) / 1000);

  if (diffSeconds < 0) {
    return 'just now';
  }
  if (diffSeconds < MINUTE) {
    return 'just now';
  }
  if (diffSeconds < HOUR) {
    const mins = Math.floor(diffSeconds / MINUTE);
    return `${mins}m ago`;
  }
  if (diffSeconds < DAY) {
    const hrs = Math.floor(diffSeconds / HOUR);
    return `${hrs}h ago`;
  }
  if (diffSeconds < WEEK) {
    const days = Math.floor(diffSeconds / DAY);
    return `${days}d ago`;
  }
  if (diffSeconds < MONTH) {
    const weeks = Math.floor(diffSeconds / WEEK);
    return `${weeks}w ago`;
  }
  const months = Math.floor(diffSeconds / MONTH);
  return `${months}mo ago`;
}

export function formatCountdown(expiresAt: string): string {
  const now = Date.now();
  const expiry = new Date(expiresAt).getTime();
  const remaining = Math.max(0, expiry - now);

  if (remaining === 0) {
    return 'Expired';
  }

  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

export function expiryProgress(createdAt: string | null, expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const end = new Date(expiresAt).getTime();
  if (Number.isNaN(end)) return 0;
  const start = createdAt ? new Date(createdAt).getTime() : end - DAY * 1000;
  const total = Math.max(1, end - start);
  return Math.min(1, Math.max(0, (end - Date.now()) / total));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
