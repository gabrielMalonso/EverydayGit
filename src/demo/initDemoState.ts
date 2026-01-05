import { useTabStore } from '../stores/tabStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { AppConfig, ChatMessage } from '../types';

import { DEMO_REPO_PATH, demoBranches, demoCommits, demoDiffByFile, demoStatus } from './fixtures';

const demoConfig: AppConfig = {
  schema_version: 1,
  ai: {
    provider: 'gemini',
    api_key: null,
    model: 'gemini-2.5-flash',
    base_url: null,
    save_model_as_default: false,
  },
  commit_preferences: {
    language: 'English',
    style: 'conventional',
    max_length: 72,
  },
  last_repo_path: DEMO_REPO_PATH,
  theme: 'dark',
  ui_language: 'pt-BR',
};

const demoChat: ChatMessage[] = [
  { role: 'assistant', content: "Hi! I'm in demo mode. Pick a file to preview its diff, or generate a commit message." },
  { role: 'user', content: 'Summarize what changed in this repo.' },
  {
    role: 'assistant',
    content:
      'You added a token-based UI foundation and started migrating panels to new components. There are staged UI changes and a README update pending.',
  },
];

let initialized = false;

export const initDemoState = () => {
  if (initialized) return;
  initialized = true;

  const store = useTabStore.getState();
  const tabId = store.activeTabId ?? store.createTab(DEMO_REPO_PATH, 'Demo');

  store.updateTab(tabId, {
    repoPath: DEMO_REPO_PATH,
    repoState: 'git',
    title: DEMO_REPO_PATH.split(/[\\/]/).pop() || 'Demo',
  });

  store.updateTabGit(tabId, {
    branches: demoBranches,
    status: demoStatus,
    commits: demoCommits,
  });

  const defaultSelectedFile = demoStatus.files[0]?.path ?? null;
  store.updateTabGit(tabId, {
    selectedFile: defaultSelectedFile,
    selectedDiff: defaultSelectedFile ? demoDiffByFile[defaultSelectedFile]?.unstaged ?? '' : '',
  });

  store.updateTabAi(tabId, {
    commitSuggestion:
      'feat(ui): migrate panels to token-based components\n\n- Update layout and typography for desktop density\n- Improve focus states, borders and shadows\n- Add demo mode for browser preview',
    commitMessageDraft:
      'feat(ui): migrate panels to token-based components\n\n- Update layout and typography for desktop density\n- Improve focus states, borders and shadows\n- Add demo mode for browser preview',
    chatMessages: demoChat,
    isGenerating: false,
  });

  useSettingsStore.getState().setConfig(demoConfig);
};
