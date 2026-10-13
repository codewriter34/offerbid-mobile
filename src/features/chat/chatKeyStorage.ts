import * as Keychain from 'react-native-keychain';
import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';

const DEVICE_ID_KEY = 'offerbid.chat.deviceId';

export async function getOrCreateDeviceId(): Promise<string> {
  let id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  }
  return id;
}

// ─── Keychain helpers ────────────────────────────────────────────────────────

async function keychainGet(service: string): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({service});
    return result ? result.password : null;
  } catch {
    return null;
  }
}

async function keychainSet(service: string, value: string): Promise<void> {
  await Keychain.setGenericPassword('offerbid', value, {service});
}

async function keychainDelete(service: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({service});
  } catch {}
}

// ─── Identity keypair ────────────────────────────────────────────────────────

const IDENTITY_SERVICE = 'offerbid.chat.identity';

export async function storeIdentityKeyPair(
  privateKeyBase64: string,
  publicKeyBase64: string,
  registrationId: number,
): Promise<void> {
  await keychainSet(
    IDENTITY_SERVICE,
    JSON.stringify({privateKey: privateKeyBase64, publicKey: publicKeyBase64, registrationId}),
  );
}

export async function loadIdentityKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
  registrationId: number;
} | null> {
  const raw = await keychainGet(IDENTITY_SERVICE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── Signed prekey ───────────────────────────────────────────────────────────

const SIGNED_PREKEY_SERVICE = 'offerbid.chat.signedprekey';

export async function storeSignedPreKey(record: {
  keyId: number;
  privateKey: string;
  publicKey: string;
  signature: string;
}): Promise<void> {
  await keychainSet(SIGNED_PREKEY_SERVICE, JSON.stringify(record));
}

export async function loadSignedPreKey(): Promise<{
  keyId: number;
  privateKey: string;
  publicKey: string;
  signature: string;
} | null> {
  const raw = await keychainGet(SIGNED_PREKEY_SERVICE);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─── One-time prekeys ────────────────────────────────────────────────────────

const OTP_SERVICE = 'offerbid.chat.prekeys';

export async function storeOneTimePreKeys(
  keys: {keyId: number; privateKey: string; publicKey: string}[],
): Promise<void> {
  const existing = await loadAllOneTimePreKeys();
  const merged = [...existing, ...keys];
  await keychainSet(OTP_SERVICE, JSON.stringify(merged));
}

export async function loadAllOneTimePreKeys(): Promise<
  {keyId: number; privateKey: string; publicKey: string}[]
> {
  const raw = await keychainGet(OTP_SERVICE);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function consumeOneTimePreKey(
  keyId: number,
): Promise<{keyId: number; privateKey: string} | null> {
  const keys = await loadAllOneTimePreKeys();
  const index = keys.findIndex(k => k.keyId === keyId);
  if (index === -1) return null;
  const [found] = keys.splice(index, 1);
  await keychainSet(OTP_SERVICE, JSON.stringify(keys));
  return {keyId: found.keyId, privateKey: found.privateKey};
}

// ─── Sessions ────────────────────────────────────────────────────────────────

function sessionService(userId: string, deviceId: string): string {
  return `offerbid.chat.session.${userId}.${deviceId}`;
}

export async function storeSession(
  userId: string,
  deviceId: string,
  serialized: string,
): Promise<void> {
  await keychainSet(sessionService(userId, deviceId), serialized);
}

export async function loadSession(
  userId: string,
  deviceId: string,
): Promise<string | null> {
  return keychainGet(sessionService(userId, deviceId));
}

export async function deleteSession(userId: string, deviceId: string): Promise<void> {
  await keychainDelete(sessionService(userId, deviceId));
}

// ─── Known peer devices ──────────────────────────────────────────────────────

const PEER_DEVICES_SERVICE = 'offerbid.chat.peerdevices';

export async function storePeerDevices(
  userId: string,
  deviceIds: string[],
): Promise<void> {
  const existing = await loadAllPeerDevices();
  existing[userId] = deviceIds;
  await keychainSet(PEER_DEVICES_SERVICE, JSON.stringify(existing));
}

export async function loadPeerDeviceIds(userId: string): Promise<string[]> {
  const all = await loadAllPeerDevices();
  return all[userId] ?? [];
}

async function loadAllPeerDevices(): Promise<Record<string, string[]>> {
  const raw = await keychainGet(PEER_DEVICES_SERVICE);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
