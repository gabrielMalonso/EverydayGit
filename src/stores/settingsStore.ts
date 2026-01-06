import { create } from 'zustand';
import i18n, { changeLanguage } from '../i18n';
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

  setConfig: (config) => {
    // Sync i18n language when config is loaded
    if (config?.ui_language && config.ui_language !== i18n.language) {
      changeLanguage(config.ui_language);
    }
    set({ config });
  },
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
