import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Check } from 'lucide-react';
import { Accordion, Button, Input, Modal, SelectMenu, ToggleSwitch } from '../ui';
import { useSettingsStore } from '../stores/settingsStore';
import { useToastStore } from '../stores/toastStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useConfig } from '../hooks/useConfig';
import type { AiProvider } from '../types';
import { isDemoMode } from '../demo/demoMode';

// Provider options for SelectMenu
const PROVIDER_OPTIONS = [
  { value: 'claude', label: 'Claude (Anthropic)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

// Language options for SelectMenu
const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Português do Brasil', label: 'Português do Brasil' },
  { value: 'Spanish', label: 'Spanish' },
];

// Style options for SelectMenu
const STYLE_OPTIONS = [
  { value: 'conventional', label: 'Conventional Commits' },
  { value: 'simple', label: 'Simple' },
  { value: 'detailed', label: 'Detailed' },
];

// Theme options for SelectMenu
const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light (Coming soon)', disabled: true },
];

// Allowed models per provider (for demo mode fallback)
const ALLOWED_MODELS: Record<string, string[]> = {
  gemini: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
  claude: ['claude-haiku-4-5-20251001'],
  openai: ['gpt-5-nano-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-4.1-2025-04-14'],
  ollama: [], // Ollama allows any model
};

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-flash',
  claude: 'claude-haiku-4-5-20251001',
  openai: 'gpt-5-nano-2025-08-07',
  ollama: '',
};

export const SettingsModal: React.FC = () => {
  const { config, isSettingsOpen, setSettingsOpen } = useSettingsStore();
  const { loadConfig, saveConfig, saveApiKey, getApiKeyStatus } = useConfig();
  const { showToast } = useToastStore();
  const { setPage } = useNavigationStore();

  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [model, setModel] = useState('');
  const [allowedModels, setAllowedModels] = useState<string[]>([]);
  const [saveModelAsDefault, setSaveModelAsDefault] = useState(false);
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('conventional');
  const [baseUrl, setBaseUrl] = useState('');
  const [maxLength, setMaxLength] = useState(72);
  const [theme, setTheme] = useState('dark');
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({
    claude: false,
    openai: false,
    gemini: false,
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [isSavingApiKeys, setIsSavingApiKeys] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;

    const loadApiKeyStatus = async () => {
      try {
        const status = await getApiKeyStatus();
        setApiKeyStatus(status);
      } catch (error) {
        console.error('Failed to load API key status:', error);
        setApiKeyStatus({
          claude: false,
          openai: false,
          gemini: false,
        });
      }
    };

    setGeminiKey('');
    setOpenaiKey('');
    setClaudeKey('');
    loadApiKeyStatus();
  }, [isSettingsOpen]);

  // Load allowed models when provider changes
  useEffect(() => {
    const loadAllowedModels = async () => {
      if (isDemoMode()) {
        setAllowedModels(ALLOWED_MODELS[provider] || []);
      } else {
        try {
          const models = await invoke<string[]>('get_allowed_models_cmd', { provider });
          setAllowedModels(models);
        } catch (error) {
          console.error('Failed to load allowed models:', error);
          setAllowedModels(ALLOWED_MODELS[provider] || []);
        }
      }
    };
    loadAllowedModels();
  }, [provider]);

  // Set default model when allowed models change
  useEffect(() => {
    if (allowedModels.length === 0 || allowedModels.includes(model)) {
      return;
    }

    const preferredModel = DEFAULT_MODELS[provider];
    if (preferredModel && allowedModels.includes(preferredModel)) {
      setModel(preferredModel);
      return;
    }

    setModel(allowedModels[0]);
  }, [allowedModels, model, provider]);

  useEffect(() => {
    if (config) {
      setProvider(config.ai.provider);
      if (config.ai.save_model_as_default) {
        setModel(config.ai.model);
      }
      setSaveModelAsDefault(config.ai.save_model_as_default ?? false);
      setLanguage(config.commit_preferences.language);
      setStyle(config.commit_preferences.style);
      setBaseUrl(config.ai.base_url || '');
      setMaxLength(config.commit_preferences.max_length);
      setTheme(config.theme);
    }
  }, [config]);

  const handleSave = async () => {
    if (!config) return;

    const newConfig = {
      ...config,
      ai: {
        ...config.ai,
        provider,
        api_key: null, // API keys are now stored separately in secrets file
        model,
        base_url: provider === 'ollama' ? (baseUrl || null) : null,
        save_model_as_default: saveModelAsDefault,
      },
      commit_preferences: {
        ...config.commit_preferences,
        language,
        style,
        max_length: maxLength,
      },
      theme,
    };

    try {
      await saveConfig(newConfig);
      setSettingsOpen(false);
      alert('Settings saved successfully!');
    } catch (error) {
      alert(`Failed to save settings: ${error}`);
    }
  };

  const handleSaveApiKeys = async () => {
    const entries = [
      { provider: 'gemini', value: geminiKey },
      { provider: 'openai', value: openaiKey },
      { provider: 'claude', value: claudeKey },
    ]
      .map((entry) => ({ ...entry, value: entry.value.trim() }))
      .filter((entry) => entry.value.length > 0);

    if (entries.length === 0) {
      showToast('Digite pelo menos uma API key para salvar.', 'warning');
      return;
    }

    setIsSavingApiKeys(true);
    try {
      for (const entry of entries) {
        await saveApiKey(entry.provider, entry.value);
      }
      const status = await getApiKeyStatus();
      setApiKeyStatus(status);
      setGeminiKey('');
      setOpenaiKey('');
      setClaudeKey('');
      showToast('API keys salvas com sucesso!', 'success');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      showToast(`Falha ao salvar API keys: ${message}`, 'error');
    } finally {
      setIsSavingApiKeys(false);
    }
  };

  const geminiConfigured = Boolean(apiKeyStatus.gemini);
  const openaiConfigured = Boolean(apiKeyStatus.openai);
  const claudeConfigured = Boolean(apiKeyStatus.claude);
  const maskedPlaceholder = '••••••••••••••••';
  const canSaveApiKeys = [geminiKey, openaiKey, claudeKey].some((key) => key.trim().length > 0);

  const apiKeysAccordion = (
    <Accordion
      items={[
        {
          id: 'api-keys',
          title: 'Configurar API Keys',
          content: (
            <div className="space-y-4">
              <Input
                label="Google (Gemini)"
                type="password"
                placeholder={geminiConfigured ? maskedPlaceholder : 'AIza...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                rightIcon={geminiConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Input
                label="OpenAI"
                type="password"
                placeholder={openaiConfigured ? maskedPlaceholder : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                rightIcon={openaiConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Input
                label="Anthropic (Claude)"
                type="password"
                placeholder={claudeConfigured ? maskedPlaceholder : 'sk-ant-...'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                rightIcon={claudeConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Button onClick={handleSaveApiKeys} variant="primary" isLoading={isSavingApiKeys} disabled={!canSaveApiKeys}>
                Salvar API Keys
              </Button>
            </div>
          ),
        },
      ]}
    />
  );

  return (
    <Modal
      isOpen={isSettingsOpen}
      onClose={() => setSettingsOpen(false)}
      ariaLabelledBy="settings-title"
      ariaDescribedBy="settings-description"
    >
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="settings-title" className="text-xl font-semibold text-text1">
              Settings
            </h2>
            <p id="settings-description" className="text-sm text-text3">
              Configure AI preferences and app appearance.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text1">AI Configuration</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Provider</label>
                <SelectMenu
                  id="settings-provider"
                  value={provider}
                  options={PROVIDER_OPTIONS}
                  onChange={(value) => setProvider(value as AiProvider)}
                />
              </div>

              {provider === 'ollama' ? (
                <>
                  <Input
                    label="Base URL (Optional)"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                  <Input
                    label="Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="llama2"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label="Usar como padrão"
                    />
                    <span className="text-sm text-text2">Usar como padrão</span>
                  </div>
                  {apiKeysAccordion}
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text2">Model</label>
                    <SelectMenu
                      id="settings-model"
                      value={model}
                      options={allowedModels.map((m) => ({ value: m, label: m }))}
                      onChange={(value) => setModel(value as string)}
                      placeholder="Select a model..."
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label="Usar como padrão"
                    />
                    <span className="text-sm text-text2">Usar como padrão</span>
                  </div>
                  {apiKeysAccordion}
                </>
              )}
            </div>
          </div>

          <div className="border-t border-border1 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-text1">Commit Preferences</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Language</label>
                <SelectMenu
                  id="settings-language"
                  value={language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(value) => setLanguage(value as string)}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Style</label>
                <SelectMenu
                  id="settings-style"
                  value={style}
                  options={STYLE_OPTIONS}
                  onChange={(value) => setStyle(value as string)}
                />
              </div>

              <Input
                label="Max Message Length"
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                placeholder="72"
              />

              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Theme</label>
                <SelectMenu
                  id="settings-theme"
                  value={theme}
                  options={THEME_OPTIONS}
                  onChange={(value) => setTheme(value as string)}
                />
                <p className="mt-1 text-xs text-text3">Light mode is not implemented yet.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-border1 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-text1">System</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text2">Setup Wizard</p>
                  <p className="text-xs text-text3">Re-run the initial setup to check Git and GitHub CLI</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSettingsOpen(false);
                    setPage('setup');
                  }}
                >
                  Open Setup
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border1 pt-4">
          <Button onClick={() => setSettingsOpen(false)} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </Modal>
  );
};
