export function isValidBidAmount(amount: number, minBid: number): boolean {
  return Number.isFinite(amount) && amount > 0 && amount >= minBid;
}

const CM_PHONE_REGEX = /^(\+?237)?[26]\d{7,8}$/;
const NG_PHONE_REGEX = /^(\+?234|0)?[789][01]\d{8}$/;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function emailTypingHint(email: string): string | null {
  const value = email.trim();
  if (!value) return null;
  if (!value.includes('@')) return 'Include an @ in your email';
  if (!value.includes('.')) return 'Include a domain, e.g. name@email.com';
  if (!isValidEmail(value)) return 'Enter a valid email address';
  return null;
}

export const PASSWORD_RULES = [
  {id: 'length', label: '8+ characters', test: (p: string) => p.length >= 8},
  {id: 'number', label: 'Number', test: (p: string) => /\d/.test(p)},
  {id: 'lower', label: 'Small letter', test: (p: string) => /[a-z]/.test(p)},
  {id: 'upper', label: 'Big letter', test: (p: string) => /[A-Z]/.test(p)},
  {id: 'symbol', label: 'Symbol', test: (p: string) => /[^A-Za-z0-9]/.test(p)},
] as const;

export function getPasswordChecks(password: string) {
  return PASSWORD_RULES.map(rule => ({
    id: rule.id,
    label: rule.label,
    met: rule.test(password),
  }));
}

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every(rule => rule.test(password));
}

export function isValidPassword(password: string): string | null {
  if (!isStrongPassword(password)) {
    return 'Use 8+ characters with a number, small letter, big letter, and symbol';
  }
  return null;
}

export function passwordTypingHint(password: string): string | null {
  if (!password) return null;
  return isValidPassword(password);
}

export function phoneTypingHint(
  phone: string,
  country: 'CAMEROON' | 'NIGERIA',
): string | null {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  if (country === 'CAMEROON') {
    if (digits.startsWith('237')) return 'Don’t include the country code';
    if (!digits.startsWith('6') && !digits.startsWith('2')) {
      return 'Cameroon numbers start with 6';
    }
    if (digits.length < 9) return `${9 - digits.length} more digit${9 - digits.length === 1 ? '' : 's'}`;
    if (digits.length > 9) return 'Use 9 digits, without +237';
    return null;
  }
  if (digits.startsWith('234') || digits.startsWith('0')) {
    return 'Don’t include 0 or the country code';
  }
  if (!/^[789]/.test(digits)) return 'Nigeria numbers start with 7, 8, or 9';
  if (digits.length < 10) return `${10 - digits.length} more digit${10 - digits.length === 1 ? '' : 's'}`;
  if (digits.length > 10) return 'Use 10 digits, without +234';
  return null;
}

export function isValidLocalPhone(
  phone: string,
  country: 'CAMEROON' | 'NIGERIA',
): boolean {
  return phoneTypingHint(phone, country) === null && phone.replace(/\D/g, '').length > 0;
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
