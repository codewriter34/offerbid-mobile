export function isValidBidAmount(amount: number, minBid: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount >= minBid;
}

const CM_PHONE_REGEX = /^(\+?237)?[26]\d{7,8}$/;
const NG_PHONE_REGEX = /^(\+?234|0)?[789][01]\d{8}$/;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidPassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-()]/g, '');
  return CM_PHONE_REGEX.test(cleaned) || NG_PHONE_REGEX.test(cleaned);
}

export function isValidListingTitle(title: string): string | null {
  const trimmed = title.trim();
  if (trimmed.length === 0) return 'Title is required';
  if (trimmed.length < 3) return 'Title must be at least 3 characters';
  if (trimmed.length > 100) return 'Title must be under 100 characters';
  return null;
}

export function isValidListingDescription(description: string): string | null {
  const trimmed = description.trim();
  if (trimmed.length === 0) return 'Description is required';
  if (trimmed.length < 10) return 'Description must be at least 10 characters';
  if (trimmed.length > 1000) return 'Description must be under 1000 characters';
  return null;
}

export function isValidPrice(price: number): string | null {
  if (!Number.isFinite(price)) return 'Enter a valid number';
  if (price <= 0) return 'Price must be greater than 0';
  if (price > 100_000_000) return 'Price is too high';
  return null;
}

export function isValidMinBid(minBid: number, startingPrice: number): string | null {
  const priceError = isValidPrice(minBid);
  if (priceError) return priceError;
  if (minBid > startingPrice) return 'Minimum bid cannot exceed starting price';
  return null;
}
