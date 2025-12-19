import { useAiStore } from '../stores/aiStore';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useSettingsStore } from '../stores/settingsStore';
import type { AppConfig, ChatMessage } from '../types';

import { DEMO_REPO_PATH, demoBranches, demoCommits, demoDiffByFile, demoStatus } from './fixtures';

const demoConfig: AppConfig = {
  schema_version: 1,
  ai: {
    provider: 'openai',
    api_key: null,
    model: 'gpt-4o-mini',
    base_url: null,
  },
  commit_preferences: {
    language: 'English',
    style: 'conventional',
    max_length: 72,
  },
  last_repo_path: DEMO_REPO_PATH,
  theme: 'dark',
};

const demoChat: ChatMessage[] = [
  { role: 'assistant', content: "Hi! I'm in demo mode. Pick a file to preview its diff, or generate a commit message." },
  { role: 'user', content: 'Summarize what changed in this repo.' },
  {
    role: 'assistant',
    content:
      "You added a token-based UI foundation and started migrating panels to new components. There are staged UI changes and a README update pending.",
  },
];

let initialized = false;

export const initDemoState = () => {
  if (initialized) return;
  initialized = true;

  useRepoStore.getState().setRepoPath(DEMO_REPO_PATH);
  useGitStore.getState().setBranches(demoBranches);
  useGitStore.getState().setStatus(demoStatus);
  useGitStore.getState().setCommits(demoCommits);

  const defaultSelectedFile = demoStatus.files[0]?.path ?? null;
  useGitStore.getState().setSelectedFile(defaultSelectedFile);
  useGitStore.getState().setSelectedDiff(
    defaultSelectedFile ? demoDiffByFile[defaultSelectedFile]?.unstaged ?? '' : '',
  );

  useAiStore.getState().setCommitSuggestion(
    'feat(ui): migrate panels to token-based components\n\n- Update layout and typography for desktop density\n- Improve focus states, borders and shadows\n- Add demo mode for browser preview',
  );
  useAiStore.setState({ chatMessages: demoChat, isGenerating: false });

  useSettingsStore.getState().setConfig(demoConfig);
};

