// X3DH-like handshake + Double Ratchet session management, built on Olm
// (see olmLoader.ts for why the asm.js "legacy" build is used).
//
// Protocol notes (kept close to the API contract in src/types/chat.ts):
//
// 1. One Olm.Account per device, created once and persisted forever via
//    store.ts. account.identity_keys() gives {curve25519, ed25519}; the
//    curve25519 half is what the API calls `identityKey`.
//
// 2. "Signed prekey" emulation: Olm only has identity keys + a one-time-key
//    pool, but the API requires signedPreKeyId/signedPreKey/signedPreKeySig.
//    We generate one extra one-time key per upload cycle, sign its public
//    value with account.sign() (Olm signs arbitrary strings with the
//    account's Ed25519 key), and exclude that specific key from the regular
//    oneTimePreKeys batch. Rotation cadence: re-derived on every upload
//    cycle (see buildKeyUploadPayload) — the simplest option the brief
//    allows, and it composes correctly with POST /chats/keys replacing the
//    server's whole pool on every call anyway.
//
// 3. Session establishment fans out per peer device: prefer the peer's
//    single-use oneTimePreKey; if the server reports the peer's OTPK pool is
//    exhausted (oneTimePreKey === null), fall back to their signedPreKey.
//    *** KNOWN GAP, flagged for review ***: the fallback path is supposed to
//    verify signedPreKey.signature against the peer's Ed25519 identity key
//    first. The live API contract this was built against only returns a
//    single `identityKey` per device (documented as the curve25519 key —
//    the one create_outbound needs), with no separate Ed25519 field. There
//    is therefore currently no way for this client to verify that signature
//    at all. We call the verification helper defensively (in case the field
//    shows up later) but it is a no-op today — see verifySignedPreKey below.
//    A malicious/compromised server could substitute an unsigned-checked
//    signedPreKey in the exhausted-pool fallback path; this should be
//    revisited with the API team (expose the peer's Ed25519 key) before
//    this fallback path is trusted in production.
//
// 4. PREKEY (Olm type 0) vs RATCHET (Olm type 1) is taken directly from
//    Olm's own session.encrypt() return value — no separate bookkeeping.
//
// 5. Receiving: inbound PREKEY with no existing session creates one
//    (consuming local OTK private material via account.remove_one_time_keys).
//    RATCHET decrypts against an existing session. This module never logs
//    plaintext, including in catch blocks — only envelope/session metadata.
//
// 6. OTPK retention: POST /chats/keys replaces the ENTIRE server-side pool
//    on every call. We do not manually delete local one-time-key private
//    material when replenishing — a peer may have already fetched an old
//    key before our replenish lands. Olm has no time-based expiry API for
//    one-time keys; the account's internal one-time-key ring is bounded by
//    account.max_number_of_one_time_keys() (Olm evicts the oldest unused
//    keys once that capacity is exceeded), which is what actually bounds
//    retention in practice. We treat ~90 days of normal replenish cadence
//    as the target retention window this bounds to, but there is no
//    explicit timer/prune job — documenting this rather than writing prune
//    code that Olm has no primitive to support.
//
// 7. Envelope fan-out: sessions are cached (in-memory + persisted pickles)
//    per (peerUserId, peerDeviceId). We only ever call
//    GET /chats/keys/:peerUserId — which consumes one scarce OTPK per
//    returned device — when we have no cached session for a peer at all, or
//    after the server has told us (via the CHAT_DEVICE_UNKNOWN /
//    "missing envelope for a device" 400) that our envelope set is stale.
//    That orchestration lives in chatService.ts, not here.
//
// 8. Own-device multi-device sync: the API rejects fetching your own prekey
//    bundle (400 "Cannot fetch your own prekey bundle this way"), so this
//    pass does not attempt to fan messages out to the sender's OTHER
//    devices — only to the peer's devices. A message sent from this device
//    will not be readable from another device signed into the same account.
import {ensureOlmReady} from './olmLoader';
import {generateUuidV4, generateRegistrationId} from './deviceId';
import {bytesToBase64} from './base64';
import * as store from './store';
import type {ChatEnvelope, OneTimePreKeyUpload, PeerDeviceBundle, UploadKeysPayload} from '../../types/chat';

const REGULAR_OTPK_BATCH_SIZE = 30;

interface LoadedAccount {
  Olm: Awaited<ReturnType<typeof ensureOlmReady>>;
  account: InstanceType<Awaited<ReturnType<typeof ensureOlmReady>>['Account']>;
  identity: store.ChatIdentityRecord;
}

let loadedAccountPromise: Promise<LoadedAccount> | null = null;
const sessionInstanceCache = new Map<
  string,
  InstanceType<Awaited<ReturnType<typeof ensureOlmReady>>['Session']>
>();

async function generatePickleKey(): Promise<string> {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

// Loads (or lazily creates) this device's permanent Olm identity. Safe to
// call repeatedly — the account is kept hot in memory after first load.
async function loadAccount(): Promise<LoadedAccount> {
  if (!loadedAccountPromise) {
    loadedAccountPromise = (async () => {
      const Olm = await ensureOlmReady();
      const existing = await store.getIdentity();

      if (existing) {
        const account = new Olm.Account();
        account.unpickle(existing.pickleKey, existing.accountPickle);
        return {Olm, account, identity: existing};
      }

      const account = new Olm.Account();
      account.create();
      const pickleKey = await generatePickleKey();
      const identity: store.ChatIdentityRecord = {
        deviceId: generateUuidV4(),
        registrationId: generateRegistrationId(),
        pickleKey,
        accountPickle: account.pickle(pickleKey),
        lastKeyUploadAt: null,
      };
      await store.saveIdentity(identity);
      return {Olm, account, identity};
    })();
  }
  return loadedAccountPromise;
}

async function persistAccount(loaded: LoadedAccount): Promise<void> {
  const updated: store.ChatIdentityRecord = {
    ...loaded.identity,
    accountPickle: loaded.account.pickle(loaded.identity.pickleKey),
  };
  loaded.identity = updated;
  await store.saveIdentity(updated);
}

export interface LocalIdentity {
  deviceId: string;
  registrationId: number;
  identityKeyCurve25519: string;
}

export async function getLocalIdentity(): Promise<LocalIdentity> {
  const loaded = await loadAccount();
  const keys = JSON.parse(loaded.account.identity_keys()) as {
    curve25519: string;
    ed25519: string;
  };
  return {
    deviceId: loaded.identity.deviceId,
    registrationId: loaded.identity.registrationId,
    identityKeyCurve25519: keys.curve25519,
  };
}

export async function getLocalDeviceId(): Promise<string> {
  return (await getLocalIdentity()).deviceId;
}

let nextKeyIdCounter = 1;

// keyId is purely an opaque server-side bookkeeping label (used to track
// which key was consumed/replaced) — Olm's own create_outbound/create_inbound
// only ever need the raw public key string, never this id, so a simple
// monotonic per-process counter is sufficient; nothing needs to map back
// from a keyId to Olm's internal key handle.
function nextKeyId(): number {
  return nextKeyIdCounter++;
}

// Builds the full payload for POST /chats/keys: a fresh batch of one-time
// prekeys plus a freshly re-derived "signed prekey" (see module doc, #2).
// Also calls account.mark_keys_as_published() so the next replenish cycle's
// account.one_time_keys() only reflects the new batch, not this one again.
export async function buildKeyUploadPayload(
  batchSize: number = REGULAR_OTPK_BATCH_SIZE,
): Promise<UploadKeysPayload> {
  const loaded = await loadAccount();
  const {account} = loaded;

  // Regular batch, then one extra key reserved for the signed-prekey slot —
  // generated in a second call so it's guaranteed to be the most recently
  // inserted key (see the ordering note below).
  account.generate_one_time_keys(batchSize);
  account.generate_one_time_keys(1);

  const otpks = (JSON.parse(account.one_time_keys()) as {curve25519: Record<string, string>})
    .curve25519;
  // Object key insertion order is preserved for non-integer-index string
  // keys (guaranteed by the spec), and generate_one_time_keys assigns ids
  // sequentially, so the last entry is the one we just reserved above.
  const entries = Object.entries(otpks);
  if (entries.length < batchSize + 1) {
    throw new Error('Olm did not generate the expected number of one-time keys');
  }
  const signedPreKeyEntry = entries[entries.length - 1];
  const regularEntries = entries.slice(0, entries.length - 1);

  const signedPreKeyPublicKey = signedPreKeyEntry[1];
  const signedPreKeySig = account.sign(signedPreKeyPublicKey);
  const signedPreKeyId = nextKeyId();

  const oneTimePreKeys: OneTimePreKeyUpload[] = regularEntries.map(([, publicKey]) => ({
    keyId: nextKeyId(),
    publicKey,
  }));

  // Mark everything we just read as published so it isn't re-offered next
  // cycle, then persist the account (generation + publish both mutate it).
  account.mark_keys_as_published();
  await persistAccount(loaded);

  const identity = await getLocalIdentity();
  return {
    deviceId: identity.deviceId,
    registrationId: identity.registrationId,
    identityKey: identity.identityKeyCurve25519,
    signedPreKeyId,
    signedPreKey: signedPreKeyPublicKey,
    signedPreKeySig,
    oneTimePreKeys,
  };
}

export async function recordKeyUploadSuccess(): Promise<void> {
  const loaded = await loadAccount();
  loaded.identity = {...loaded.identity, lastKeyUploadAt: Date.now()};
  await store.saveIdentity(loaded.identity);
}

// See module doc #3: verification is a documented no-op today because the
// live API contract doesn't expose the peer's Ed25519 identity key. Kept as
// a real function (not inlined) so wiring it up later is a one-line change
// at the call site once that field exists.
async function verifySignedPreKey(
  _peerEd25519IdentityKey: string | undefined,
  _signedPreKeyPublicKey: string,
  _signature: string,
): Promise<{verified: boolean; attempted: boolean}> {
  if (!_peerEd25519IdentityKey) {
    return {verified: false, attempted: false};
  }
  const loaded = await loadAccount();
  const utility = new loaded.Olm.Utility();
  try {
    utility.ed25519_verify(_peerEd25519IdentityKey, _signedPreKeyPublicKey, _signature);
    return {verified: true, attempted: true};
  } catch {
    return {verified: false, attempted: true};
  } finally {
    utility.free();
  }
}

async function getOrCreateOutboundSession(
  peerUserId: string,
  device: PeerDeviceBundle,
): Promise<InstanceType<Awaited<ReturnType<typeof ensureOlmReady>>['Session']>> {
  const loaded = await loadAccount();
  const key = store.sessionKey(peerUserId, device.deviceId);

  const cached = sessionInstanceCache.get(key);
  if (cached) return cached;

  const sessions = await store.getSessions();
  const persistedPickle = sessions[key];
  if (persistedPickle) {
    const session = new loaded.Olm.Session();
    session.unpickle(loaded.identity.pickleKey, persistedPickle);
    sessionInstanceCache.set(key, session);
    return session;
  }

  let theirOneTimeKey: string;
  if (device.oneTimePreKey) {
    theirOneTimeKey = device.oneTimePreKey.publicKey;
  } else {
    // Peer's OTPK pool is exhausted server-side — fall back to their
    // signed prekey (see module doc #3 for the verification caveat). The
    // API doesn't expose an Ed25519 key today, so this can never actually
    // succeed — fail closed (matching the web client's behavior) rather
    // than silently using an unverified key.
    const {verified} = await verifySignedPreKey(
      undefined,
      device.signedPreKey.publicKey,
      device.signedPreKey.signature,
    );
    if (!verified) {
      throw new Error(
        "Could not verify this device's signed prekey — refusing to fall back to an unverified key",
      );
    }
    theirOneTimeKey = device.signedPreKey.publicKey;
  }

  const session = new loaded.Olm.Session();
  session.create_outbound(loaded.account, device.identityKey, theirOneTimeKey);
  sessionInstanceCache.set(key, session);
  await store.saveSession(key, session.pickle(loaded.identity.pickleKey));
  return session;
}

export async function hasSessionWith(peerUserId: string, peerDeviceId: string): Promise<boolean> {
  const key = store.sessionKey(peerUserId, peerDeviceId);
  if (sessionInstanceCache.has(key)) return true;
  const sessions = await store.getSessions();
  return Boolean(sessions[key]);
}

// Encrypts `plaintext` for a single peer device, establishing (and
// persisting) an outbound session on first use, reusing it thereafter.
export async function encryptForDevice(
  peerUserId: string,
  device: PeerDeviceBundle,
  plaintext: string,
): Promise<ChatEnvelope> {
  const loaded = await loadAccount();
  const session = await getOrCreateOutboundSession(peerUserId, device);
  const {type, body} = session.encrypt(plaintext);

  const key = store.sessionKey(peerUserId, device.deviceId);
  await store.saveSession(key, session.pickle(loaded.identity.pickleKey));

  return {
    recipientUserId: peerUserId,
    recipientDeviceId: device.deviceId,
    type: type === 0 ? 'PREKEY' : 'RATCHET',
    ciphertext: body,
  };
}

// Decrypts an inbound envelope addressed to this device. Never logs
// plaintext — callers must also avoid doing so.
export async function decryptEnvelope(
  envelope: ChatEnvelope,
  senderUserId: string,
  senderDeviceId: string,
): Promise<string> {
  const loaded = await loadAccount();
  const key = store.sessionKey(senderUserId, senderDeviceId);
  const olmMessageType = envelope.type === 'PREKEY' ? 0 : 1;

  let session = sessionInstanceCache.get(key);
  if (!session) {
    const sessions = await store.getSessions();
    const persistedPickle = sessions[key];
    if (persistedPickle) {
      session = new loaded.Olm.Session();
      session.unpickle(loaded.identity.pickleKey, persistedPickle);
    }
  }

  const needsFreshInboundSession =
    !session || (envelope.type === 'PREKEY' && !session.matches_inbound(envelope.ciphertext));

  if (needsFreshInboundSession) {
    if (envelope.type !== 'PREKEY') {
      // A RATCHET message with no matching session cannot be decrypted —
      // the sender must have started a session we never received the
      // opening PREKEY message for (e.g. lost/out-of-order delivery).
      throw new Error('No session available to decrypt this message');
    }
    session = new loaded.Olm.Session();
    session.create_inbound(loaded.account, envelope.ciphertext);
    loaded.account.remove_one_time_keys(session);
    await persistAccount(loaded);
  }

  const plaintext = session!.decrypt(olmMessageType, envelope.ciphertext);
  sessionInstanceCache.set(key, session!);
  await store.saveSession(key, session!.pickle(loaded.identity.pickleKey));
  return plaintext;
}
