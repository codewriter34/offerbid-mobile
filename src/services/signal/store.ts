// Persistence for the chat identity (Olm Account + deviceId) and Double
// Ratchet sessions, following the same react-native-keychain pattern as
// src/services/tokenStorage.ts. Kept as JSON blobs under dedicated Keychain
// services so this never shares storage with the auth token entry.
//
// IMPORTANT: never persist or log plaintext message content from this module
// or anywhere in src/services/signal/ — only ciphertext, pickles (which are
// themselves encrypted-at-rest blobs) and metadata (ids, counts) belong here.
import * as Keychain from 'react-native-keychain';

const IDENTITY_SERVICE = 'com.offerbid.chat.identity';
const SESSIONS_SERVICE = 'com.offerbid.chat.sessions';

export interface ChatIdentityRecord {
  deviceId: string;
  registrationId: number;
  // Symmetric key (base64) used to pickle/unpickle the Olm Account and every
  // Session below. Generated once, stored alongside the account pickle.
  // Keychain already encrypts this at rest; pickling on top of that is
  // defense in depth and matches the convention other Olm-based clients use.
  pickleKey: string;
  accountPickle: string;
  // Bookkeeping for the OTPK "signed prekey" retention discussion — see
  // crypto.ts's buildKeyUploadPayload for why no active pruning job is
  // needed beyond this timestamp existing for diagnostics.
  lastKeyUploadAt: number | null;
}

// Sessions are keyed by `${peerUserId}:${peerDeviceId}`.
export type SessionMap = Record<string, string>;

let identityCache: ChatIdentityRecord | null | undefined; // undefined = not loaded yet
let sessionsCache: SessionMap | null = null;

export async function getIdentity(): Promise<ChatIdentityRecord | null> {
  if (identityCache !== undefined) {
    return identityCache;
  }
  try {
    const creds = await Keychain.getGenericPassword({service: IDENTITY_SERVICE});
    if (!creds) {
      identityCache = null;
      return null;
    }
    identityCache = JSON.parse(creds.password) as ChatIdentityRecord;
    return identityCache;
  } catch {
    identityCache = null;
    return null;
  }
}

export async function saveIdentity(record: ChatIdentityRecord): Promise<void> {
  identityCache = record;
  await Keychain.setGenericPassword('offerbid-chat-identity', JSON.stringify(record), {
    service: IDENTITY_SERVICE,
  });
}

export async function getSessions(): Promise<SessionMap> {
  if (sessionsCache) {
    return sessionsCache;
  }
  try {
    const creds = await Keychain.getGenericPassword({service: SESSIONS_SERVICE});
    sessionsCache = creds ? (JSON.parse(creds.password) as SessionMap) : {};
    return sessionsCache;
  } catch {
    sessionsCache = {};
    return sessionsCache;
  }
}

export async function saveSession(key: string, pickle: string): Promise<void> {
  const sessions = await getSessions();
  sessions[key] = pickle;
  sessionsCache = sessions;
  await Keychain.setGenericPassword('offerbid-chat-sessions', JSON.stringify(sessions), {
    service: SESSIONS_SERVICE,
  });
}

export function sessionKey(peerUserId: string, peerDeviceId: string): string {
  return `${peerUserId}:${peerDeviceId}`;
}

// Test/sign-out helper — clears in-memory caches only; Keychain entries are
// intentionally NOT wiped on sign-out today (the identity is tied to the
// device, not the session, and re-uploading keys on every re-login would
// burn through the server's replace-on-write semantics for no benefit).
export function clearInMemoryCaches(): void {
  identityCache = undefined;
  sessionsCache = null;
}
