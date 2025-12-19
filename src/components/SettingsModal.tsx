import React, { useEffect, useState } from 'react';
import { Button, Input, Modal } from '../ui';
import { useSettingsStore } from '../stores/settingsStore';
import { useConfig } from '../hooks/useConfig';
import type { AiProvider } from '../types';

export const SettingsModal: React.FC = () => {
  const { config, isSettingsOpen, setSettingsOpen } = useSettingsStore();
  const { loadConfig, saveConfig } = useConfig();

  const [provider, setProvider] = useState<AiProvider>('claude');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [language, setLanguage] = useState('English');
  const [style, setStyle] = useState('conventional');
  const [baseUrl, setBaseUrl] = useState('');
  const [maxLength, setMaxLength] = useState(72);
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (config) {
      setProvider(config.ai.provider);
      setApiKey(config.ai.api_key || '');
      setModel(config.ai.model);
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
        api_key: apiKey || null,
        model,
        base_url: baseUrl || null,
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
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AiProvider)}
                  className="w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
                >
                  <option value="claude">Claude (Anthropic)</option>
                  <option value="openai">OpenAI</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </div>

              {provider !== 'ollama' && (
                <div className="space-y-2">
                  <Input
                    label="API Key"
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your API key..."
                  />
                  <div className="rounded-card-inner border border-warningBg/60 bg-warningBg/10 p-2">
                    <p className="text-xs text-warningFg">
                      API keys are stored in plain text in the config file. Keep it secure and do not share it.
                    </p>
                  </div>
                </div>
              )}

              {provider === 'ollama' && (
                <Input
                  label="Base URL (Optional)"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:11434"
                />
              )}

              <Input
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={
                  provider === 'claude'
                    ? 'claude-3-5-sonnet-20241022'
                    : provider === 'openai'
                    ? 'gpt-4'
                    : 'llama2'
                }
              />
            </div>
          </div>

          <div className="border-t border-border1 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-text1">Commit Preferences</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
                >
                  <option value="English">English</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text2">Style</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
                >
                  <option value="conventional">Conventional Commits</option>
                  <option value="simple">Simple</option>
                  <option value="detailed">Detailed</option>
                </select>
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
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light (Coming soon)</option>
                </select>
                <p className="mt-1 text-xs text-text3">Light mode is not implemented yet.</p>
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
