import { create } from 'zustand';
import type { SetupStatus } from '../types';

export type SetupMode = 'assisted' | 'manual';
export type InstallStatus = 'idle' | 'installing' | 'success' | 'error';

interface SetupState {
  status: SetupStatus | null;
  isChecking: boolean;
  mode: SetupMode;
  setupSkipped: boolean;
  installProgress: {
    git: InstallStatus;
    gh: InstallStatus;
    gh_auth: InstallStatus;
  };
  setStatus: (status: SetupStatus | null) => void;
  setIsChecking: (isChecking: boolean) => void;
  setMode: (mode: SetupMode) => void;
  setSetupSkipped: (setupSkipped: boolean) => void;
  setInstallProgress: (key: keyof SetupState['installProgress'], status: InstallStatus) => void;
  resetInstallProgress: () => void;
}

const initialProgress: SetupState['installProgress'] = {
  git: 'idle',
  gh: 'idle',
  gh_auth: 'idle',
};

export const useSetupStore = create<SetupState>((set) => ({
  status: null,
  isChecking: false,
  mode: 'assisted',
  setupSkipped: false,
  installProgress: initialProgress,

  setStatus: (status) => set({ status }),
  setIsChecking: (isChecking) => set({ isChecking }),
  setMode: (mode) => set({ mode }),
  setSetupSkipped: (setupSkipped) => set({ setupSkipped }),
  setInstallProgress: (key, status) =>
    set((state) => ({
      installProgress: { ...state.installProgress, [key]: status },
    })),
  resetInstallProgress: () => set({ installProgress: initialProgress }),
}));
