import React, { useEffect, useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
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

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary border border-border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-auto">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-text-primary">Settings</h2>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              AI Configuration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary font-medium mb-2 block">
                  Provider
                </label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as AiProvider)}
                  className="w-full bg-bg-elevated text-text-primary border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
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
                  <div className="p-2 bg-yellow-900/20 border border-yellow-700/50 rounded">
                    <p className="text-xs text-yellow-400">
                      Warning: API keys are stored in plain text in the config file.
                      Keep your config file secure and do not share it.
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

          <div className="border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              Commit Preferences
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-text-secondary font-medium mb-2 block">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-bg-elevated text-text-primary border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="English">English</option>
                  <option value="Portuguese">Portuguese</option>
                  <option value="Spanish">Spanish</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-text-secondary font-medium mb-2 block">
                  Style
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-bg-elevated text-text-primary border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
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
                <label className="text-sm text-text-secondary font-medium mb-2 block">
                  Theme
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full bg-bg-elevated text-text-primary border border-border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light (Coming soon)</option>
                </select>
                <p className="text-xs text-text-secondary mt-1">
                  Note: Light mode is not implemented yet.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-2">
          <Button onClick={() => setSettingsOpen(false)} variant="ghost">
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
