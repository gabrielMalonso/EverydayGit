import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settingsStore';
import type { AppConfig, AiConfig } from '../types';

export const useConfig = () => {
  const { setConfig } = useSettingsStore();

  const loadConfig = async () => {
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
    try {
      await invoke('save_config_cmd', { configData: config });
      setConfig(config);
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const updateAiConfig = async (aiConfig: AiConfig) => {
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
