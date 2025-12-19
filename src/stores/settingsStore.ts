import { create } from 'zustand';
import type { AppConfig } from '../types';

interface SettingsStore {
  config: AppConfig | null;
  isSettingsOpen: boolean;

  setConfig: (config: AppConfig | null) => void;
  setSettingsOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  config: null,
  isSettingsOpen: false,

  setConfig: (config) => set({ config }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
