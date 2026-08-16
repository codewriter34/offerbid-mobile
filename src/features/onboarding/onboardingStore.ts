import {create} from 'zustand';
import {
  getHasCompletedOnboarding,
  setHasCompletedOnboarding,
} from '@shared/lib/onboardingStorage';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>(set => ({
  hasCompletedOnboarding: false,
  isHydrated: false,

  hydrate: async () => {
    const done = await getHasCompletedOnboarding();
    set({hasCompletedOnboarding: done, isHydrated: true});
  },

  completeOnboarding: async () => {
    await setHasCompletedOnboarding();
    set({hasCompletedOnboarding: true, isHydrated: true});
  },
}));
