import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../stores/settingsStore';
import type { AppConfig, AiConfig } from '../types';
import { isDemoMode, isTauriRuntime } from '../demo/demoMode';

const DEFAULT_API_KEY_STATUS: Record<string, boolean> = {
  claude: false,
  openai: false,
  gemini: false,
};

let demoApiKeyStatus = { ...DEFAULT_API_KEY_STATUS };

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

  const saveApiKey = async (provider: string, apiKey: string) => {
    const normalizedKey = apiKey.trim();
    if (!normalizedKey) {
      throw new Error('API key cannot be empty.');
    }

    if (!isTauriRuntime()) {
      if (isDemoMode()) {
        demoApiKeyStatus = { ...demoApiKeyStatus, [provider]: true };
        return;
      }
      console.warn('Tauri API unavailable in browser preview, skipping API key save.');
      return;
    }

    try {
      await invoke('save_api_key_cmd', { provider, apiKey: normalizedKey });
    } catch (error) {
      console.error('Failed to save API key:', error);
      throw error;
    }
  };

  const getApiKeyStatus = async (): Promise<Record<string, boolean>> => {
    if (!isTauriRuntime()) {
      if (isDemoMode()) {
        return { ...demoApiKeyStatus };
      }
      console.warn('Tauri API unavailable in browser preview, skipping API key status.');
      return { ...DEFAULT_API_KEY_STATUS };
    }

    try {
      const status = await invoke<Record<string, boolean>>('get_api_key_status_cmd');
      return { ...DEFAULT_API_KEY_STATUS, ...status };
    } catch (error) {
      console.error('Failed to load API key status:', error);
      throw error;
    }
  };

  return {
    loadConfig,
    saveConfig,
    updateAiConfig,
    saveApiKey,
    getApiKeyStatus,
  };
};
