import {
  generateAndStoreIdentityIfMissing,
  buildKeyBundleForUpload,
  generateReplenishmentKeys,
} from './chatCrypto';
import {fetchMyKeyStatus, uploadKeys, replenishOneTimePreKeys} from './chatService';
import {useChatStore} from './chatStore';

const OTP_REPLENISH_THRESHOLD = 10;

export async function uploadKeysIfNeeded(): Promise<void> {
  try {
    await generateAndStoreIdentityIfMissing();
    let status = null;
    try {
      status = await fetchMyKeyStatus();
    } catch {
      // 404 = no keys uploaded yet
    }
    if (!status || status.oneTimePreKeyCount < OTP_REPLENISH_THRESHOLD) {
      const bundle = await buildKeyBundleForUpload();
      await uploadKeys(bundle);
      useChatStore.getState().setKeysUploaded(true);
    } else {
      useChatStore.getState().setKeysUploaded(true);
      if (status.oneTimePreKeyCount < OTP_REPLENISH_THRESHOLD) {
        const keys = await generateReplenishmentKeys(20);
        await replenishOneTimePreKeys(keys);
      }
    }
  } catch {
    // Non-fatal: chat will surface errors per-send
  }
}
