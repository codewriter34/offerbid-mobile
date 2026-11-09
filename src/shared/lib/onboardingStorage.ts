import * as SecureStore from 'expo-secure-store';
import {withTimeout} from '@shared/lib/withTimeout';

const KEY = 'offerbid.hasCompletedOnboarding';
const STORE_TIMEOUT_MS = 2500;

export async function getHasCompletedOnboarding(): Promise<boolean> {
  const raw = await withTimeout(
    SecureStore.getItemAsync(KEY).catch(() => null),
    STORE_TIMEOUT_MS,
    null,
  );
  return raw === '1';
}

export async function setHasCompletedOnboarding(): Promise<void> {
  await withTimeout(
    SecureStore.setItemAsync(KEY, '1').then(() => true).catch(() => false),
    STORE_TIMEOUT_MS,
    false,
  );
}
