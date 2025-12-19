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
      },
      commit_preferences: {
        ...config.commit_preferences,
        language,
        style,
      },
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
                <Input
                  label="API Key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
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
