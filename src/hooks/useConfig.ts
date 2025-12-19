import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settingsStore';
import type { AppConfig, AiConfig } from '../types';
import { isDemoMode, isTauriRuntime } from '../demo/demoMode';

export const useConfig = () => {
  const { setConfig } = useSettingsStore();

  const loadConfig = async () => {
    if (!isTauriRuntime()) {
      if (isDemoMode()) {
        // In demo mode we keep any preloaded config (set during demo bootstrap).
        return useSettingsStore.getState().config;
      }

      console.warn('Tauri API unavailable in browser preview, skipping config load.');
      setConfig(null);
      return null;
    }

    try {
      const config = await invoke<AppConfig>('load_config_cmd');
      setConfig(config);
      return config;
    } catch (error) {
      console.error('Failed to load config:', error);
      throw error;
    }
  };

  const saveConfig = async (config: AppConfig) => {
    if (!isTauriRuntime()) {
      if (!isDemoMode()) {
        console.warn('Tauri API unavailable in browser preview, skipping config save.');
      }
      setConfig(config);
      return;
    }

    try {
      await invoke('save_config_cmd', { configData: config });
      setConfig(config);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const updateAiConfig = async (aiConfig: AiConfig) => {
    if (!isTauriRuntime()) {
      if (!isDemoMode()) {
        console.warn('Tauri API unavailable in browser preview, skipping AI config update.');
      }
      return;
    }

    try {
      await invoke('update_ai_config_cmd', { aiConfig });
      await loadConfig();
    } catch (error) {
      console.error('Failed to update AI config:', error);
      throw error;
    }
  };

  return {
    loadConfig,
    saveConfig,
    updateAiConfig,
  };
};
