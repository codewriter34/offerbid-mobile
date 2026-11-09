import {create} from 'zustand';

export type SuccessBurstKind = 'confetti' | 'check';

export interface SuccessBurstOptions {
  title: string;
  message: string;
  actionLabel?: string;
  kind?: SuccessBurstKind;
  onAction?: () => void;
}

interface SuccessBurstState {
  visible: boolean;
  kind: SuccessBurstKind;
  title: string;
  message: string;
  actionLabel: string;
  onAction: (() => void) | null;
  show: (options: SuccessBurstOptions) => void;
  hide: () => void;
}

export const useSuccessBurstStore = create<SuccessBurstState>(set => ({
  visible: false,
  kind: 'confetti',
  title: '',
  message: '',
  actionLabel: 'Done',
  onAction: null,
  show: options =>
    set({
      visible: true,
      kind: options.kind ?? 'confetti',
      title: options.title,
      message: options.message,
      actionLabel: options.actionLabel ?? 'Done',
      onAction: options.onAction ?? null,
    }),
  hide: () => set({visible: false, onAction: null}),
}));

export function showSuccessBurst(options: SuccessBurstOptions) {
  useSuccessBurstStore.getState().show(options);
}
