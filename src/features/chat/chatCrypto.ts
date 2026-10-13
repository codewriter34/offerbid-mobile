/**
 * Signal Protocol wrapper (X3DH + Double Ratchet) using libsignal-protocol.
 * The plaintext NEVER leaves this module — only base64 ciphertext is returned.
 *
 * Uses the pure-JS `libsignal-protocol` package which works with Metro bundler.
 * If you switch to @signalapp/libsignal-client (WASM), the store adapters below
 * remain the same; only the crypto primitives change.
 */
import {
  KeyHelper,
  SignalProtocolAddress,
  SessionBuilder,
  SessionCipher,
  PreKeyWhisperMessage,
  WhisperMessage,
} from 'libsignal-protocol';
import {
  getOrCreateDeviceId,
  storeIdentityKeyPair,
  loadIdentityKeyPair,
  storeSignedPreKey,
  loadSignedPreKey,
  storeOneTimePreKeys,
  loadAllOneTimePreKeys,
  consumeOneTimePreKey,
  storeSession,
  loadSession,
  storePeerDevices,
  loadPeerDeviceIds,
} from './chatKeyStorage';
import {Envelope, EnvelopeType, KeyBundle, UploadKeysPayload} from './chatTypes';

// ─── Signal store adapters ────────────────────────────────────────────────────
// libsignal-protocol requires these four stores. We back them with Keychain.

function makeIdentityKeyStore() {
  return {
    getIdentityKeyPair: async () => {
      const stored = await loadIdentityKeyPair();
      if (!stored) throw new Error('Identity key pair not found');
      return {
        pubKey: Buffer.from(stored.publicKey, 'base64'),
        privKey: Buffer.from(stored.privateKey, 'base64'),
      };
    },
    getLocalRegistrationId: async () => {
      const stored = await loadIdentityKeyPair();
      return stored?.registrationId ?? 0;
    },
    saveIdentity: async (_address: string, _key: ArrayBuffer) => false,
    isTrustedIdentity: async () => true,
    loadIdentityKey: async () => undefined,
  };
}

function makePreKeyStore() {
  return {
    loadPreKey: async (keyId: number) => {
      const keys = await loadAllOneTimePreKeys();
      const found = keys.find(k => k.keyId === keyId);
      if (!found) throw new Error(`PreKey ${keyId} not found`);
      return {
        pubKey: Buffer.from(found.publicKey, 'base64'),
        privKey: Buffer.from(found.privateKey, 'base64'),
      };
    },
    storePreKey: async () => {},
    removePreKey: async (keyId: number) => {
      await consumeOneTimePreKey(keyId);
    },
  };
}

function makeSignedPreKeyStore() {
  return {
    loadSignedPreKey: async (_keyId: number) => {
      const stored = await loadSignedPreKey();
      if (!stored) throw new Error('Signed prekey not found');
      return {
        pubKey: Buffer.from(stored.publicKey, 'base64'),
        privKey: Buffer.from(stored.privateKey, 'base64'),
      };
    },
    storeSignedPreKey: async () => {},
    removeSignedPreKey: async () => {},
  };
}

function makeSessionStore() {
  return {
    loadSession: async (address: string) => {
      const [userId, deviceId] = address.split('.');
      const serialized = await loadSession(userId, deviceId ?? '0');
      return serialized ? Buffer.from(serialized, 'base64') : undefined;
    },
    storeSession: async (address: string, record: ArrayBuffer) => {
      const [userId, deviceId] = address.split('.');
      const b64 = Buffer.from(record).toString('base64');
      await storeSession(userId, deviceId ?? '0', b64);
    },
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateAndStoreIdentityIfMissing(): Promise<{
  publicKey: string;
  registrationId: number;
}> {
  const existing = await loadIdentityKeyPair();
  if (existing) {
    return {publicKey: existing.publicKey, registrationId: existing.registrationId};
  }
  const identityKeyPair = await KeyHelper.generateIdentityKeyPair();
  const registrationId = await KeyHelper.generateRegistrationId();
  const pub = Buffer.from(identityKeyPair.pubKey).toString('base64');
  const priv = Buffer.from(identityKeyPair.privKey).toString('base64');
  await storeIdentityKeyPair(priv, pub, registrationId);
  return {publicKey: pub, registrationId};
}

export async function buildKeyBundleForUpload(): Promise<UploadKeysPayload> {
  const deviceId = await getOrCreateDeviceId();
  const identity = await generateAndStoreIdentityIfMissing();

  const signedPreKeyId = 1;
  const signedPreKeyPair = await KeyHelper.generateSignedPreKey(
    {
      pubKey: Buffer.from(identity.publicKey, 'base64'),
      privKey: Buffer.from(
        (await loadIdentityKeyPair())!.privateKey,
        'base64',
      ),
    },
    signedPreKeyId,
  );
  await storeSignedPreKey({
    keyId: signedPreKeyId,
    privateKey: Buffer.from(signedPreKeyPair.keyPair.privKey).toString('base64'),
    publicKey: Buffer.from(signedPreKeyPair.keyPair.pubKey).toString('base64'),
    signature: Buffer.from(signedPreKeyPair.signature).toString('base64'),
  });

  const oneTimeKeys: UploadKeysPayload['oneTimePreKeys'] = [];
  const storedOTPs: Parameters<typeof storeOneTimePreKeys>[0] = [];
  for (let i = 0; i < 20; i++) {
    const keyId = Date.now() + i;
    const kp = await KeyHelper.generatePreKey(keyId);
    const pub = Buffer.from(kp.keyPair.pubKey).toString('base64');
    const priv = Buffer.from(kp.keyPair.privKey).toString('base64');
    oneTimeKeys.push({keyId, publicKey: pub});
    storedOTPs.push({keyId, privateKey: priv, publicKey: pub});
  }
  await storeOneTimePreKeys(storedOTPs);

  return {
    deviceId,
    identityKey: identity.publicKey,
    registrationId: identity.registrationId,
    signedPreKey: {
      keyId: signedPreKeyId,
      publicKey: Buffer.from(signedPreKeyPair.keyPair.pubKey).toString('base64'),
      signature: Buffer.from(signedPreKeyPair.signature).toString('base64'),
    },
    oneTimePreKeys: oneTimeKeys,
  };
}

export async function generateReplenishmentKeys(count = 20): Promise<
  {keyId: number; publicKey: string}[]
> {
  const storedOTPs: Parameters<typeof storeOneTimePreKeys>[0] = [];
  const result: {keyId: number; publicKey: string}[] = [];
  for (let i = 0; i < count; i++) {
    const keyId = Date.now() + i;
    const kp = await KeyHelper.generatePreKey(keyId);
    const pub = Buffer.from(kp.keyPair.pubKey).toString('base64');
    const priv = Buffer.from(kp.keyPair.privKey).toString('base64');
    result.push({keyId, publicKey: pub});
    storedOTPs.push({keyId, privateKey: priv, publicKey: pub});
  }
  await storeOneTimePreKeys(storedOTPs);
  return result;
}

export async function initSessionFromBundle(
  peerUserId: string,
  bundle: KeyBundle,
): Promise<void> {
  const stores = {
    identityKeyStore: makeIdentityKeyStore(),
    preKeyStore: makePreKeyStore(),
    signedPreKeyStore: makeSignedPreKeyStore(),
    sessionStore: makeSessionStore(),
  };

  const deviceIds: string[] = [];
  for (const device of bundle.devices) {
    const address = new SignalProtocolAddress(peerUserId, parseInt(device.deviceId, 16) || 1);
    const builder = new SessionBuilder(stores, address);
    await builder.processPreKey({
      registrationId: device.registrationId,
      identityKey: Buffer.from(device.identityKey, 'base64'),
      signedPreKey: {
        keyId: device.signedPreKey.keyId,
        publicKey: Buffer.from(device.signedPreKey.publicKey, 'base64'),
        signature: Buffer.from(device.signedPreKey.signature, 'base64'),
      },
      preKey: device.oneTimePreKey
        ? {
            keyId: device.oneTimePreKey.keyId,
            publicKey: Buffer.from(device.oneTimePreKey.publicKey, 'base64'),
          }
        : undefined,
    });
    deviceIds.push(device.deviceId);
  }
  await storePeerDevices(peerUserId, deviceIds);
}

export async function encryptForPeer(
  peerUserId: string,
  peerDeviceId: string,
  plaintext: string,
): Promise<Envelope> {
  const stores = {
    identityKeyStore: makeIdentityKeyStore(),
    preKeyStore: makePreKeyStore(),
    signedPreKeyStore: makeSignedPreKeyStore(),
    sessionStore: makeSessionStore(),
  };
  const numericDeviceId = parseInt(peerDeviceId, 16) || 1;
  const address = new SignalProtocolAddress(peerUserId, numericDeviceId);
  const cipher = new SessionCipher(stores, address);
  const encoded = new TextEncoder().encode(plaintext);
  const result = await cipher.encrypt(encoded);
  const isPreKey = result.type === 3;
  return {
    recipientUserId: peerUserId,
    recipientDeviceId: peerDeviceId,
    type: isPreKey ? 'PREKEY' : 'RATCHET',
    ciphertext: Buffer.from(result.body).toString('base64'),
  };
}

export async function encryptForAllPeerDevices(
  peerUserId: string,
  plaintext: string,
): Promise<Envelope[]> {
  const deviceIds = await loadPeerDeviceIds(peerUserId);
  return Promise.all(
    deviceIds.map(deviceId => encryptForPeer(peerUserId, deviceId, plaintext)),
  );
}

export async function decryptEnvelope(
  senderUserId: string,
  senderDeviceId: string,
  type: EnvelopeType,
  ciphertextBase64: string,
): Promise<string> {
  const stores = {
    identityKeyStore: makeIdentityKeyStore(),
    preKeyStore: makePreKeyStore(),
    signedPreKeyStore: makeSignedPreKeyStore(),
    sessionStore: makeSessionStore(),
  };
  const numericDeviceId = parseInt(senderDeviceId, 16) || 1;
  const address = new SignalProtocolAddress(senderUserId, numericDeviceId);
  const cipher = new SessionCipher(stores, address);
  const cipherBuf = Buffer.from(ciphertextBase64, 'base64');
  let plainBytes: ArrayBuffer;
  if (type === 'PREKEY') {
    plainBytes = await cipher.decryptPreKeyWhisperMessage(
      cipherBuf,
      'binary',
    );
  } else {
    plainBytes = await cipher.decryptWhisperMessage(cipherBuf, 'binary');
  }
  return new TextDecoder().decode(plainBytes);
}
