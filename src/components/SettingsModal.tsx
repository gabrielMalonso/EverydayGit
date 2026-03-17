import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Accordion, Button, Input, Modal, SelectMenu, ToggleSwitch } from '../ui';
import { useSettingsStore } from '../stores/settingsStore';
import { useConfig } from '../hooks/useConfig';
import { changeLanguage } from '../i18n';
import type { AiProvider, CodexStatus, ClaudeCodeStatus } from '../types';
import { isDemoMode } from '../demo/demoMode';

// Provider options for SelectMenu
const PROVIDER_OPTIONS = [
  { value: 'claude-code', label: 'Claude Code (Anthropic Subscription)' },
  { value: 'codex', label: 'Codex (ChatGPT Subscription)' },
  { value: 'claude', label: 'Claude (Anthropic API)' },
  { value: 'openai', label: 'OpenAI' },
  { value: 'gemini', label: 'Gemini (Google)' },
  { value: 'ollama', label: 'Ollama (Local)' },
];

// Language options for SelectMenu (commit message language)
const LANGUAGE_OPTIONS = [
  { value: 'English', label: 'English' },
  { value: 'Português do Brasil', label: 'Português do Brasil' },
  { value: 'Spanish', label: 'Spanish' },
];

// Theme options for SelectMenu
const THEME_OPTIONS = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light (Coming soon)', disabled: true },
];

// UI Language options
const UI_LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'es', label: 'Español' },
];

// Allowed models per provider (for demo mode fallback)
const ALLOWED_MODELS: Record<string, string[]> = {
  gemini: ['gemini-3-flash-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'],
  claude: ['claude-haiku-4-5-20251001'],
  openai: ['gpt-5-nano-2025-08-07', 'gpt-5-mini-2025-08-07', 'gpt-4.1-2025-04-14'],
  codex: ['gpt-5.1-codex-mini', 'gpt-5.4'],
  'claude-code': ['claude-sonnet-4-6', 'claude-haiku-4-5'],
  ollama: [],
};

const DEFAULT_MODELS: Record<AiProvider, string> = {
  gemini: 'gemini-2.5-flash',
  claude: 'claude-haiku-4-5-20251001',
  openai: 'gpt-5-nano-2025-08-07',
  codex: 'gpt-5.1-codex-mini',
  'claude-code': 'claude-sonnet-4-6',
  ollama: '',
};

export const SettingsModal: React.FC = () => {
  const { t } = useTranslation('settings');
  const { config, isSettingsOpen, setSettingsOpen, setConfig } = useSettingsStore();
  const { loadConfig, saveConfig, saveApiKey, getApiKeyStatus } = useConfig();

  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [model, setModel] = useState('');
  const [allowedModels, setAllowedModels] = useState<string[]>([]);
  const [saveModelAsDefault, setSaveModelAsDefault] = useState(false);
  const [language, setLanguage] = useState('English');
  const [baseUrl, setBaseUrl] = useState('');
  const [maxLength, setMaxLength] = useState(72);
  const [theme, setTheme] = useState('dark');
  const [uiLanguage, setUiLanguage] = useState('pt-BR');
  const [apiKeyStatus, setApiKeyStatus] = useState<Record<string, boolean>>({
    claude: false,
    openai: false,
    gemini: false,
  });
  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [isSavingApiKeys, setIsSavingApiKeys] = useState(false);
  const [codexStatus, setCodexStatus] = useState<CodexStatus | null>(null);
  const [claudeCodeStatus, setClaudeCodeStatus] = useState<ClaudeCodeStatus | null>(null);

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

  // Check Codex status when provider changes to codex
  useEffect(() => {
    if (provider !== 'codex') {
      setCodexStatus(null);
      return;
    }
    const checkCodex = async () => {
      if (isDemoMode()) {
        setCodexStatus({ installed: true, version: 'codex-cli 0.114.0', authenticated: true, auth_info: 'Logged in using ChatGPT', error: null });
        return;
      }
      try {
        const status = await invoke<CodexStatus>('check_codex_status_cmd');
        setCodexStatus(status);
      } catch (err) {
        setCodexStatus({ installed: false, version: null, authenticated: false, auth_info: null, error: String(err) });
      }
    };
    checkCodex();
  }, [provider]);

  // Check Claude Code status when provider changes to claude-code
  useEffect(() => {
    if (provider !== 'claude-code') {
      setClaudeCodeStatus(null);
      return;
    }
    const checkClaudeCode = async () => {
      if (isDemoMode()) {
        setClaudeCodeStatus({ installed: true, version: '2.1.77 (Claude Code)', error: null });
        return;
      }
      try {
        const status = await invoke<ClaudeCodeStatus>('check_claude_code_status_cmd');
        setClaudeCodeStatus(status);
      } catch (err) {
        setClaudeCodeStatus({ installed: false, version: null, error: String(err) });
      }
    };
    checkClaudeCode();
  }, [provider]);

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
      setBaseUrl(config.ai.base_url || '');
      setMaxLength(config.commit_preferences.max_length);
      setTheme(config.theme);
      setUiLanguage(config.ui_language || 'pt-BR');
    }
  }, [config]);

  const handleUiLanguageChange = (newLang: string) => {
    setUiLanguage(newLang);
    changeLanguage(newLang);
  };

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
        style: 'conventional',
        max_length: maxLength,
      },
      theme,
      ui_language: uiLanguage,
    };

    try {
      await saveConfig(newConfig);
      setConfig(newConfig);
      setSettingsOpen(false);
      toast.success(t('actions.saveSuccess'));
    } catch (error) {
      toast.error(t('actions.saveFailed', { error: String(error) }));
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
      toast.warning(t('ai.apiKeys.enterAtLeastOne'));
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
      toast.success(t('ai.apiKeys.saveSuccess'));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error(t('ai.apiKeys.saveFailed', { error: message }));
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
          title: t('ai.apiKeys.title'),
          content: (
            <div className="space-y-4">
              <Input
                label={t('ai.apiKeys.google')}
                type="password"
                placeholder={geminiConfigured ? maskedPlaceholder : 'AIza...'}
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                rightIcon={geminiConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Input
                label={t('ai.apiKeys.openai')}
                type="password"
                placeholder={openaiConfigured ? maskedPlaceholder : 'sk-proj-...'}
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                rightIcon={openaiConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Input
                label={t('ai.apiKeys.anthropic')}
                type="password"
                placeholder={claudeConfigured ? maskedPlaceholder : 'sk-ant-...'}
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                rightIcon={claudeConfigured ? <Check className="h-4 w-4 text-successFg" /> : null}
              />
              <Button onClick={handleSaveApiKeys} variant="primary" isLoading={isSavingApiKeys} disabled={!canSaveApiKeys}>
                {t('ai.apiKeys.saveButton')}
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
      contentClassName="flex flex-col max-h-[calc(100vh-6rem)]"
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 pb-4">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="settings-title" className="text-xl font-semibold text-text1">
                {t('title')}
              </h2>
              <p id="settings-description" className="text-sm text-text3">
                {t('description')}
              </p>
            </div>
          </div>

          <div className="space-y-6">
          <div>
            <h3 className="mb-4 text-lg font-semibold text-text1">{t('ai.title')}</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">{t('ai.provider')}</label>
                <SelectMenu
                  id="settings-provider"
                  value={provider}
                  options={PROVIDER_OPTIONS}
                  onChange={(value) => setProvider(value as AiProvider)}
                />
              </div>

              {provider === 'claude-code' ? (
                <>
                  <div className="rounded-lg border border-border1 bg-surface2 p-3 space-y-2">
                    <p className="text-sm font-medium text-text2">{t('ai.claudeCode.status')}</p>
                    {claudeCodeStatus ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          {claudeCodeStatus.installed ? (
                            <Check className="h-4 w-4 text-successFg" />
                          ) : (
                            <span className="h-4 w-4 text-dangerFg">✕</span>
                          )}
                          <span className="text-text2">
                            {claudeCodeStatus.installed
                              ? `${t('ai.claudeCode.installed')} (${claudeCodeStatus.version})`
                              : t('ai.claudeCode.notInstalled')}
                          </span>
                        </div>
                        {!claudeCodeStatus.installed && claudeCodeStatus.error && (
                          <div className="text-xs text-text3 ml-6 break-all">
                            {claudeCodeStatus.error}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-text3">{t('ai.claudeCode.checking')}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text2">{t('ai.model')}</label>
                    <SelectMenu
                      id="settings-claude-code-model"
                      value={model}
                      options={allowedModels.map((m) => ({ value: m, label: m }))}
                      onChange={(value) => setModel(value as string)}
                      placeholder={t('ai.selectModel')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label={t('ai.useAsDefault')}
                    />
                    <span className="text-sm text-text2">{t('ai.useAsDefault')}</span>
                  </div>
                </>
              ) : provider === 'codex' ? (
                <>
                  <div className="rounded-lg border border-border1 bg-surface2 p-3 space-y-2">
                    <p className="text-sm font-medium text-text2">{t('ai.codex.status')}</p>
                    {codexStatus ? (
                      <>
                        <div className="flex items-center gap-2 text-sm">
                          {codexStatus.installed ? (
                            <Check className="h-4 w-4 text-successFg" />
                          ) : (
                            <span className="h-4 w-4 text-dangerFg">✕</span>
                          )}
                          <span className="text-text2">
                            {codexStatus.installed
                              ? `${t('ai.codex.installed')} (${codexStatus.version})`
                              : t('ai.codex.notInstalled')}
                          </span>
                        </div>
                        {!codexStatus.installed && codexStatus.error && (
                          <div className="text-xs text-text3 ml-6 break-all">
                            {codexStatus.error}
                          </div>
                        )}
                        {codexStatus.installed && (
                          <div className="flex items-center gap-2 text-sm">
                            {codexStatus.authenticated ? (
                              <Check className="h-4 w-4 text-successFg" />
                            ) : (
                              <span className="h-4 w-4 text-dangerFg">✕</span>
                            )}
                            <span className="text-text2">
                              {codexStatus.authenticated
                                ? codexStatus.auth_info || t('ai.codex.authenticated')
                                : t('ai.codex.notAuthenticated')}
                            </span>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-text3">{t('ai.codex.checking')}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text2">{t('ai.model')}</label>
                    <SelectMenu
                      id="settings-codex-model"
                      value={model}
                      options={allowedModels.map((m) => ({ value: m, label: m }))}
                      onChange={(value) => setModel(value as string)}
                      placeholder={t('ai.selectModel')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label={t('ai.useAsDefault')}
                    />
                    <span className="text-sm text-text2">{t('ai.useAsDefault')}</span>
                  </div>
                </>
              ) : provider === 'ollama' ? (
                <>
                  <Input
                    label={t('ai.baseUrl')}
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder={t('ai.baseUrlPlaceholder')}
                  />
                  <Input
                    label={t('ai.model')}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="llama2"
                  />
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label={t('ai.useAsDefault')}
                    />
                    <span className="text-sm text-text2">{t('ai.useAsDefault')}</span>
                  </div>
                  {apiKeysAccordion}
                </>
              ) : (
                <>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-text2">{t('ai.model')}</label>
                    <SelectMenu
                      id="settings-model"
                      value={model}
                      options={allowedModels.map((m) => ({ value: m, label: m }))}
                      onChange={(value) => setModel(value as string)}
                      placeholder={t('ai.selectModel')}
                    />
                  </div>
                  <div className="mt-2 flex items-center gap-3">
                    <ToggleSwitch
                      checked={saveModelAsDefault}
                      onToggle={() => setSaveModelAsDefault((prev) => !prev)}
                      label={t('ai.useAsDefault')}
                    />
                    <span className="text-sm text-text2">{t('ai.useAsDefault')}</span>
                  </div>
                  {apiKeysAccordion}
                </>
              )}
            </div>
          </div>

          <div className="border-t border-border1 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-text1">{t('commitPreferences.title')}</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">{t('commitPreferences.language')}</label>
                <SelectMenu
                  id="settings-language"
                  value={language}
                  options={LANGUAGE_OPTIONS}
                  onChange={(value) => setLanguage(value as string)}
                />
              </div>

              <Input
                label={t('commitPreferences.maxLength')}
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(Number(e.target.value))}
                placeholder="72"
              />
            </div>
          </div>

          <div className="border-t border-border1 pt-6">
            <h3 className="mb-4 text-lg font-semibold text-text1">{t('appearance.title')}</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text2">{t('appearance.theme')}</label>
                <SelectMenu
                  id="settings-theme"
                  value={theme}
                  options={THEME_OPTIONS}
                  onChange={(value) => setTheme(value as string)}
                />
                <p className="mt-1 text-xs text-text3">{t('appearance.lightNotImplemented')}</p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text2">{t('uiLanguage.label')}</label>
                <SelectMenu
                  id="settings-ui-language"
                  value={uiLanguage}
                  options={UI_LANGUAGE_OPTIONS}
                  onChange={(value) => handleUiLanguageChange(value as string)}
                />
                <p className="mt-1 text-xs text-text3">{t('uiLanguage.description')}</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border1 bg-surface1 px-6 py-4">
        <div className="flex justify-end gap-2">
          <Button onClick={() => setSettingsOpen(false)} variant="ghost">
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('actions.save')}</Button>
        </div>
      </div>
    </Modal>
  );
};
