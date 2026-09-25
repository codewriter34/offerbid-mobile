// UUID v4 generation for the permanent per-install chat deviceId, using the
// native RNG polyfilled by react-native-get-random-values (imported at the
// top of index.js). No separate `uuid` package is needed for this.

export function generateUuidV4(): string {
  const bytes = new Uint8Array(16);
  // global.crypto.getRandomValues is installed by react-native-get-random-values.
  crypto.getRandomValues(bytes);

  // Per RFC 4122 §4.4.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

// A 14-bit-ish registration id, in the spirit of the Signal protocol's
// registrationId (a per-device identifier the server can use to detect stale
// key bundles). Olm has no native concept of one — we mint our own and
// persist it permanently alongside deviceId.
export function generateRegistrationId(): number {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return ((bytes[0] << 8) | bytes[1]) & 0x3fff || 1;
}
