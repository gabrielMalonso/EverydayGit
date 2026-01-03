import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Branch, CommitInfo, RepoStatus, Worktree, ChatMessage } from '@/types';

export type TabPage = 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup' | 'init-repo';

export interface TabGitState {
  status: RepoStatus | null;
  branches: Branch[];
  worktrees: Worktree[];
  commits: CommitInfo[];
  selectedFile: string | null;
  selectedDiff: string | null;
  isLoading: boolean;
}

export interface TabMergeState {
  isMergeInProgress: boolean;
  conflictCount: number;
}

export interface TabAiState {
  commitSuggestion: string | null;
  commitMessageDraft: string;
  isGenerating: boolean;
  chatMessages: ChatMessage[];
}

export interface TabState {
  tabId: string;
  title: string;
  repoPath: string | null;
  repoState: 'none' | 'git' | 'no-git';
  git: TabGitState;
  navigation: {
    currentPage: TabPage;
  };
  merge: TabMergeState;
  ai: TabAiState;
}

interface TabStoreState {
  tabs: Record<string, TabState>;
  activeTabId: string | null;
  tabOrder: string[];

  createTab: (repoPath?: string | null, title?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;

  updateTab: (tabId: string, updates: Partial<TabState>) => void;
  updateTabGit: (tabId: string, updates: Partial<TabGitState>) => void;
  updateTabNavigation: (tabId: string, page: TabPage) => void;
  updateTabMerge: (tabId: string, updates: Partial<TabMergeState>) => void;
  updateTabAi: (tabId: string, updates: Partial<TabAiState>) => void;
  resetTabGit: (tabId: string) => void;

  getActiveTab: () => TabState | undefined;
  getTab: (tabId: string) => TabState | undefined;
}

const createTabId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const getTitleFromPath = (repoPath?: string | null) => {
  if (!repoPath) return 'Nova Aba';
  const parts = repoPath.split(/[\\/]/);
  return parts[parts.length - 1] || repoPath;
};

const createEmptyGitState = (): TabGitState => ({
  status: null,
  branches: [],
  worktrees: [],
  commits: [],
  selectedFile: null,
  selectedDiff: null,
  isLoading: false,
});

const createEmptyAiState = (): TabAiState => ({
  commitSuggestion: null,
  commitMessageDraft: '',
  isGenerating: false,
  chatMessages: [],
});

const createEmptyTabState = (tabId: string, repoPath?: string | null, title?: string): TabState => ({
  tabId,
  title: title || getTitleFromPath(repoPath),
  repoPath: repoPath || null,
  repoState: 'none',
  git: createEmptyGitState(),
  navigation: { currentPage: 'commits' },
  merge: { isMergeInProgress: false, conflictCount: 0 },
  ai: createEmptyAiState(),
});

export const useTabStore = create<TabStoreState>()(
  persist(
    (set, get) => ({
      tabs: {},
      activeTabId: null,
      tabOrder: [],

      createTab: (repoPath, title) => {
        const tabId = createTabId();
        const newTab = createEmptyTabState(tabId, repoPath, title);

        set((state) => ({
          tabs: { ...state.tabs, [tabId]: newTab },
          tabOrder: [...state.tabOrder, tabId],
          activeTabId: tabId,
        }));

        return tabId;
      },

      closeTab: (tabId) => {
        const { tabs, tabOrder, activeTabId } = get();

        if (tabOrder.length === 1) {
          return;
        }

        const nextTabs = { ...tabs };
        delete nextTabs[tabId];
        const nextOrder = tabOrder.filter((id) => id !== tabId);

        let nextActive = activeTabId;
        if (activeTabId === tabId) {
          const currentIndex = tabOrder.indexOf(tabId);
          nextActive = nextOrder[Math.max(0, currentIndex - 1)] || nextOrder[0] || null;
        }

        set({
          tabs: nextTabs,
          tabOrder: nextOrder,
          activeTabId: nextActive,
        });
      },

      setActiveTab: (tabId) => {
        if (get().tabs[tabId]) {
          set({ activeTabId: tabId });
        }
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const nextOrder = [...state.tabOrder];
          const [removed] = nextOrder.splice(fromIndex, 1);
          nextOrder.splice(toIndex, 0, removed);
          return { tabOrder: nextOrder };
        });
      },

      updateTab: (tabId, updates) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                ...updates,
              },
            },
          };
        });
      },

      updateTabGit: (tabId, updates) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                git: { ...state.tabs[tabId].git, ...updates },
              },
            },
          };
        });
      },

      updateTabNavigation: (tabId, page) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                navigation: { currentPage: page },
              },
            },
          };
        });
      },

      updateTabMerge: (tabId, updates) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                merge: { ...state.tabs[tabId].merge, ...updates },
              },
            },
          };
        });
      },

      updateTabAi: (tabId, updates) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                ai: { ...state.tabs[tabId].ai, ...updates },
              },
            },
          };
        });
      },

      resetTabGit: (tabId) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: {
                ...state.tabs[tabId],
                git: createEmptyGitState(),
              },
            },
          };
        });
      },

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return activeTabId ? tabs[activeTabId] : undefined;
      },

      getTab: (tabId) => get().tabs[tabId],
    }),
    {
      name: 'everydaygit-tabs',
      partialize: (state) => ({
        tabs: Object.fromEntries(
          Object.entries(state.tabs).map(([id, tab]) => [
            id,
            {
              tabId: tab.tabId,
              title: tab.title,
              repoPath: tab.repoPath,
              repoState: tab.repoState,
              navigation: tab.navigation,
            },
          ]),
        ),
        tabOrder: state.tabOrder,
        activeTabId: state.activeTabId,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<TabStoreState>;
        const storedTabs = stored.tabs ?? {};
        const nextTabs: Record<string, TabState> = {};

        for (const [id, tab] of Object.entries(storedTabs)) {
          const base = createEmptyTabState(id, tab.repoPath ?? null, tab.title);
          nextTabs[id] = {
            ...base,
            tabId: tab.tabId ?? id,
            title: tab.title ?? base.title,
            repoPath: tab.repoPath ?? base.repoPath,
            repoState: tab.repoState ?? base.repoState,
            navigation: tab.navigation ?? base.navigation,
          };
        }

        const nextOrder = (stored.tabOrder ?? []).filter((id) => nextTabs[id]);
        const nextActive =
          stored.activeTabId && nextTabs[stored.activeTabId] ? stored.activeTabId : nextOrder[0] ?? null;

        return {
          ...current,
          ...stored,
          tabs: nextTabs,
          tabOrder: nextOrder,
          activeTabId: nextActive,
        };
      },
    },
  ),
);

export const useActiveTab = () => useTabStore((state) => state.getActiveTab());
export const useActiveTabId = () => useTabStore((state) => state.activeTabId);
export const useTabs = () =>
  useTabStore((state) => state.tabOrder.map((id) => state.tabs[id]).filter(Boolean));
