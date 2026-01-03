# Plano de Implementação: Sistema de Abas Independentes

> **Objetivo:** Permitir que o usuário abra múltiplos repositórios/worktrees em abas dentro da mesma janela, com estado 100% isolado entre elas (como abas de navegador).

---

## Contexto e Motivação

Atualmente, ao abrir uma worktree ou outro repositório, o EverydayGit abre uma nova janela Tauri. Isso funciona, mas:
- Cria overhead de memória (uma instância React por janela)
- Dificulta navegação rápida entre repositórios
- Não segue o padrão mental de "abas" que usuários conhecem de navegadores/IDEs

A boa notícia: **a arquitetura atual já suporta isolamento por contexto**. O backend usa `window_label` para identificar cada janela, e cada janela tem stores Zustand independentes. Precisamos apenas estender esse conceito para abas dentro da mesma janela.

---

## Requisitos Confirmados

1. **Abas independentes**: Cada aba funciona como uma janela separada (estado 100% isolado)
2. **Preservar estado**: Ao trocar de aba e voltar, tudo deve estar preservado (arquivos staged, seleção, scroll, etc.)
3. **Fechar última aba = fecha o app**
4. **Worktrees sempre em aba**: Ao abrir worktree, abre em nova aba (nunca em nova janela)

---

## Arquitetura Proposta

### Visão Geral

```
                              JANELA TAURI (única)
┌─────────────────────────────────────────────────────────────────────────────┐
│ [main ●] [feature/auth] [worktree-hotfix] [+]                  ← TabBar    │
├─────────────────────────────────────────────────────────────────────────────┤
│          │ TopBar (contexto da aba ativa)                                   │
│ Sidebar  ├──────────────────────────────────────────────────────────────────┤
│          │ Conteúdo da página (CommitsPage, BranchesPage, etc.)             │
│          │ ← Renderiza apenas a aba ativa, mas preserva estado das outras   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Modelo de Estado

```
                         tabStore (Zustand)
┌─────────────────────────────────────────────────────────────────────────────┐
│  tabs: {                                                                     │
│    "uuid-1": {                                                               │
│      tabId: "uuid-1",                                                        │
│      title: "main",                                                          │
│      repoPath: "/Users/.../projeto",                                         │
│      repoState: "git",                                                       │
│      git: { status, branches, commits, selectedFile, selectedDiff, ... },   │
│      navigation: { currentPage: "commits" },                                 │
│      merge: { isMergeInProgress: false, conflictCount: 0 },                  │
│      ai: { commitSuggestion: null, isGenerating: false }                     │
│    },                                                                        │
│    "uuid-2": {                                                               │
│      tabId: "uuid-2",                                                        │
│      title: "feature/auth",                                                  │
│      repoPath: "/Users/.../projeto-worktree-auth",                           │
│      ...                                                                     │
│    }                                                                         │
│  },                                                                          │
│  activeTabId: "uuid-1",                                                      │
│  tabOrder: ["uuid-1", "uuid-2"]  // ordem visual das abas                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Backend (Rust)

O `AppState` atual usa `HashMap<window_label, repo_path>`. Vamos estender para usar chave composta:

```
                         AppState.repos
┌─────────────────────────────────────────────────────────────────────────────┐
│  HashMap<String, PathBuf>                                                   │
│    "main:uuid-1" → /Users/.../projeto                                       │
│    "main:uuid-2" → /Users/.../projeto-worktree-auth                         │
│    "main:uuid-3" → /Users/.../outro-repo                                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementação

### Fase 1: Infraestrutura Base

**Objetivo:** Criar o sistema de gerenciamento de abas e contexto.

#### 1.1 Criar `src/stores/tabStore.ts`

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { RepoStatus, Branch, Worktree, CommitInfo } from '@/types';

// Estado Git isolado por aba
interface TabGitState {
  status: RepoStatus | null;
  branches: Branch[];
  worktrees: Worktree[];
  commits: CommitInfo[];
  selectedFile: string | null;
  selectedDiff: string | null;
  isLoading: boolean;
}

// Estado completo de uma aba
interface TabState {
  tabId: string;
  title: string;
  repoPath: string | null;
  repoState: 'none' | 'git' | 'no-git';
  git: TabGitState;
  navigation: {
    currentPage: 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup' | 'init-repo';
  };
  merge: {
    isMergeInProgress: boolean;
    conflictCount: number;
  };
  ai: {
    commitSuggestion: string | null;
    commitMessageDraft: string;
    isGenerating: boolean;
  };
}

interface TabStoreState {
  // Estado
  tabs: Record<string, TabState>;
  activeTabId: string | null;
  tabOrder: string[];

  // Ações de gerenciamento de abas
  createTab: (repoPath?: string | null, title?: string) => string;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;

  // Ações de atualização de estado da aba
  updateTab: (tabId: string, updates: Partial<TabState>) => void;
  updateTabGit: (tabId: string, updates: Partial<TabGitState>) => void;
  updateTabNavigation: (tabId: string, page: TabState['navigation']['currentPage']) => void;
  updateTabMerge: (tabId: string, updates: Partial<TabState['merge']>) => void;
  updateTabAi: (tabId: string, updates: Partial<TabState['ai']>) => void;

  // Getters
  getActiveTab: () => TabState | undefined;
  getTab: (tabId: string) => TabState | undefined;
}

const createEmptyGitState = (): TabGitState => ({
  status: null,
  branches: [],
  worktrees: [],
  commits: [],
  selectedFile: null,
  selectedDiff: null,
  isLoading: false,
});

const createEmptyTabState = (tabId: string, repoPath?: string | null, title?: string): TabState => ({
  tabId,
  title: title || (repoPath ? repoPath.split('/').pop() || 'Sem título' : 'Nova Aba'),
  repoPath: repoPath || null,
  repoState: 'none',
  git: createEmptyGitState(),
  navigation: { currentPage: 'commits' },
  merge: { isMergeInProgress: false, conflictCount: 0 },
  ai: { commitSuggestion: null, commitMessageDraft: '', isGenerating: false },
});

export const useTabStore = create<TabStoreState>()(
  persist(
    (set, get) => ({
      tabs: {},
      activeTabId: null,
      tabOrder: [],

      createTab: (repoPath, title) => {
        const tabId = uuidv4();
        const newTab = createEmptyTabState(tabId, repoPath, title);

        set((state) => ({
          tabs: { ...state.tabs, [tabId]: newTab },
          tabOrder: [...state.tabOrder, tabId],
          activeTabId: tabId, // Nova aba fica ativa
        }));

        return tabId;
      },

      closeTab: (tabId) => {
        const { tabs, tabOrder, activeTabId } = get();

        // Se é a última aba, fecha a janela
        if (tabOrder.length === 1) {
          // Será tratado no componente - window.close()
          return;
        }

        const newTabs = { ...tabs };
        delete newTabs[tabId];
        const newOrder = tabOrder.filter((id) => id !== tabId);

        // Determina nova aba ativa
        let newActiveId = activeTabId;
        if (activeTabId === tabId) {
          const currentIndex = tabOrder.indexOf(tabId);
          // Tenta aba à esquerda, senão à direita
          newActiveId = newOrder[Math.max(0, currentIndex - 1)] || newOrder[0];
        }

        set({
          tabs: newTabs,
          tabOrder: newOrder,
          activeTabId: newActiveId,
        });
      },

      setActiveTab: (tabId) => {
        if (get().tabs[tabId]) {
          set({ activeTabId: tabId });
        }
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newOrder = [...state.tabOrder];
          const [removed] = newOrder.splice(fromIndex, 1);
          newOrder.splice(toIndex, 0, removed);
          return { tabOrder: newOrder };
        });
      },

      updateTab: (tabId, updates) => {
        set((state) => {
          if (!state.tabs[tabId]) return state;
          return {
            tabs: {
              ...state.tabs,
              [tabId]: { ...state.tabs[tabId], ...updates },
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

      getActiveTab: () => {
        const { tabs, activeTabId } = get();
        return activeTabId ? tabs[activeTabId] : undefined;
      },

      getTab: (tabId) => get().tabs[tabId],
    }),
    {
      name: 'everydaygit-tabs',
      // Persistir apenas metadados, não estado Git completo
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
          ])
        ),
        tabOrder: state.tabOrder,
        activeTabId: state.activeTabId,
      }),
    }
  )
);

// Seletores úteis
export const useActiveTab = () => useTabStore((state) => state.getActiveTab());
export const useActiveTabId = () => useTabStore((state) => state.activeTabId);
export const useTabs = () => useTabStore((state) => state.tabOrder.map((id) => state.tabs[id]));
```

#### 1.2 Criar `src/contexts/TabContext.tsx`

```typescript
import { createContext, useContext, type ReactNode } from 'react';

interface TabContextValue {
  tabId: string;
}

const TabContext = createContext<TabContextValue | null>(null);

interface TabProviderProps {
  tabId: string;
  children: ReactNode;
}

export const TabProvider = ({ tabId, children }: TabProviderProps) => {
  return <TabContext.Provider value={{ tabId }}>{children}</TabContext.Provider>;
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

// Hook de conveniência
export const useCurrentTabId = () => useTabContext().tabId;
```

#### 1.3 Criar `src/hooks/useTabId.ts`

```typescript
import { getWindowLabel } from './useWindowLabel';
import { useCurrentTabId } from '@/contexts/TabContext';

/**
 * Gera a chave de contexto composta para identificar a aba no backend
 * Formato: "windowLabel:tabId"
 */
export const getContextKey = (windowLabel: string, tabId: string): string => {
  return `${windowLabel}:${tabId}`;
};

/**
 * Hook que retorna a chave de contexto da aba atual
 */
export const useContextKey = (): string => {
  const tabId = useCurrentTabId();
  const windowLabel = getWindowLabel();
  return getContextKey(windowLabel, tabId);
};
```

#### 1.4 Modificar `src-tauri/src/commands/mod.rs`

Adicionar suporte a chave composta e comando de cleanup:

```rust
// No início do arquivo, adicionar helper:

/// Obtém a chave de contexto (suporta formato "window:tab" ou apenas "window")
fn get_context_key(window_label: &str, tab_id: Option<&str>) -> String {
    match tab_id {
        Some(tid) if !tid.is_empty() => format!("{}:{}", window_label, tid),
        _ => window_label.to_string(),
    }
}

// Modificar set_repository para aceitar tab_id opcional:

#[tauri::command]
pub fn set_repository(
    path: String,
    window_label: String,
    tab_id: Option<String>,  // NOVO parâmetro
    state: State<AppState>,
) -> Result<RepoSelectionResult, String> {
    let context_key = get_context_key(&window_label, tab_id.as_deref());

    let repo_path = PathBuf::from(&path);
    if !repo_path.exists() {
        return Err(format!("Path does not exist: {}", path));
    }

    let is_git = repo_path.join(".git").exists();

    state.repos.lock().unwrap().insert(context_key, repo_path);

    Ok(RepoSelectionResult { is_git })
}

// Adicionar novo comando para cleanup de aba:

#[tauri::command]
pub fn unset_tab_repository(
    context_key: String,
    state: State<AppState>,
) -> Result<(), String> {
    state.repos.lock().unwrap().remove(&context_key);
    Ok(())
}

// Modificar get_repo_path para usar context_key:

fn get_repo_path(state: &State<AppState>, context_key: &str) -> Result<PathBuf, String> {
    let repos = state.repos.lock().unwrap();
    repos
        .get(context_key)
        .cloned()
        .ok_or_else(|| format!("No repository selected for context: {}", context_key))
}

// Modificar TODOS os comandos Git para aceitar context_key ao invés de window_label:
// Exemplo para get_git_status:

#[tauri::command]
pub fn get_git_status(
    context_key: String,  // Era window_label
    state: State<AppState>,
) -> Result<RepoStatus, String> {
    let repo_path = get_repo_path(&state, &context_key)?;
    // ... resto igual
}

// Fazer o mesmo para TODOS os outros comandos:
// - get_branches_cmd
// - get_commit_log
// - stage_file_cmd
// - unstage_file_cmd
// - stage_all_cmd
// - commit_cmd
// - push_cmd
// - pull_cmd
// - get_file_diff
// - get_all_diff_cmd
// - checkout_branch_cmd
// - create_branch_cmd
// - delete_branch_cmd
// - merge_preview_cmd
// - merge_branch_cmd
// - compare_branches_cmd
// - get_worktrees_cmd
// - add_worktree_cmd
// - remove_worktree_cmd
// - etc.
```

#### 1.5 Modificar `src-tauri/src/lib.rs`

Registrar o novo comando:

```rust
.invoke_handler(tauri::generate_handler![
    // ... comandos existentes ...
    commands::unset_tab_repository,  // NOVO
])
```

---

### Fase 2: Stores Scoped por Aba

**Objetivo:** Fazer os hooks existentes usarem o estado da aba ativa.

#### 2.1 Criar `src/hooks/useTabGit.ts`

Este hook substitui o uso direto de `useGit` + `gitStore`:

```typescript
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from './useTabId';
import { isDemoMode } from '@/demo/demoMode';
import type { RepoStatus, Branch, CommitInfo, Worktree } from '@/types';

export const useTabGit = () => {
  const tabId = useCurrentTabId();
  const contextKey = useContextKey();
  const { getTab, updateTabGit, updateTab } = useTabStore();

  const tab = getTab(tabId);
  const git = tab?.git;

  // Status
  const refreshStatus = useCallback(async () => {
    if (isDemoMode()) {
      // Implementar demo mode se necessário
      return;
    }

    updateTabGit(tabId, { isLoading: true });
    try {
      const status = await invoke<RepoStatus>('get_git_status', { contextKey });
      updateTabGit(tabId, { status, isLoading: false });
    } catch (error) {
      console.error('Failed to get git status:', error);
      updateTabGit(tabId, { isLoading: false });
    }
  }, [tabId, contextKey, updateTabGit]);

  // Branches
  const refreshBranches = useCallback(async () => {
    if (isDemoMode()) return;

    try {
      const branches = await invoke<Branch[]>('get_branches_cmd', { contextKey });
      updateTabGit(tabId, { branches });
    } catch (error) {
      console.error('Failed to get branches:', error);
    }
  }, [tabId, contextKey, updateTabGit]);

  // Commits
  const refreshCommits = useCallback(async (limit = 50) => {
    if (isDemoMode()) return;

    try {
      const commits = await invoke<CommitInfo[]>('get_commit_log', { contextKey, limit });
      updateTabGit(tabId, { commits });
    } catch (error) {
      console.error('Failed to get commits:', error);
    }
  }, [tabId, contextKey, updateTabGit]);

  // Worktrees
  const refreshWorktrees = useCallback(async () => {
    if (isDemoMode()) return;

    try {
      const worktrees = await invoke<Worktree[]>('get_worktrees_cmd', { contextKey });
      updateTabGit(tabId, { worktrees });
    } catch (error) {
      console.error('Failed to get worktrees:', error);
    }
  }, [tabId, contextKey, updateTabGit]);

  // Stage/Unstage
  const stageFile = useCallback(async (filePath: string) => {
    await invoke('stage_file_cmd', { contextKey, filePath });
    await refreshStatus();
  }, [contextKey, refreshStatus]);

  const unstageFile = useCallback(async (filePath: string) => {
    await invoke('unstage_file_cmd', { contextKey, filePath });
    await refreshStatus();
  }, [contextKey, refreshStatus]);

  const stageAll = useCallback(async () => {
    await invoke('stage_all_cmd', { contextKey });
    await refreshStatus();
  }, [contextKey, refreshStatus]);

  // Commit
  const commit = useCallback(async (message: string) => {
    await invoke('commit_cmd', { contextKey, message });
    await Promise.all([refreshStatus(), refreshCommits()]);
  }, [contextKey, refreshStatus, refreshCommits]);

  // Push/Pull
  const push = useCallback(async () => {
    await invoke('push_cmd', { contextKey });
    await refreshStatus();
  }, [contextKey, refreshStatus]);

  const pull = useCallback(async () => {
    await invoke('pull_cmd', { contextKey });
    await Promise.all([refreshStatus(), refreshCommits()]);
  }, [contextKey, refreshStatus, refreshCommits]);

  // Diff
  const getFileDiff = useCallback(async (filePath: string, staged: boolean) => {
    const diff = await invoke<string>('get_file_diff', { contextKey, filePath, staged });
    updateTabGit(tabId, { selectedFile: filePath, selectedDiff: diff });
    return diff;
  }, [tabId, contextKey, updateTabGit]);

  const getAllDiff = useCallback(async (staged: boolean) => {
    return invoke<string>('get_all_diff_cmd', { contextKey, staged });
  }, [contextKey]);

  // Branches
  const checkoutBranch = useCallback(async (branchName: string) => {
    await invoke('checkout_branch_cmd', { contextKey, branchName });
    await Promise.all([refreshStatus(), refreshBranches(), refreshCommits()]);
  }, [contextKey, refreshStatus, refreshBranches, refreshCommits]);

  const createBranch = useCallback(async (name: string, from?: string, pushToRemote = false) => {
    await invoke('create_branch_cmd', { contextKey, name, from, pushToRemote });
    await refreshBranches();
  }, [contextKey, refreshBranches]);

  const deleteBranch = useCallback(async (name: string, force = false, isRemote = false) => {
    await invoke('delete_branch_cmd', { contextKey, name, force, isRemote });
    await refreshBranches();
  }, [contextKey, refreshBranches]);

  // Worktrees - IMPORTANTE: abre em nova aba
  const openWorktreeInNewTab = useCallback(async (worktreePath: string, worktreeBranch: string) => {
    const { createTab } = useTabStore.getState();
    const newTabId = createTab(worktreePath, worktreeBranch);

    // Registrar no backend
    const windowLabel = (await import('./useWindowLabel')).getWindowLabel();
    const newContextKey = `${windowLabel}:${newTabId}`;

    await invoke('set_repository', {
      path: worktreePath,
      windowLabel,
      tabId: newTabId,
    });

    // A aba já foi ativada no createTab
  }, []);

  const addWorktree = useCallback(async (branchName: string, path: string) => {
    await invoke('add_worktree_cmd', { contextKey, branchName, path });
    await refreshWorktrees();
  }, [contextKey, refreshWorktrees]);

  const removeWorktree = useCallback(async (worktreePath: string, force = false) => {
    await invoke('remove_worktree_cmd', { contextKey, worktreePath, force });
    await refreshWorktrees();
  }, [contextKey, refreshWorktrees]);

  // Refresh all
  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshStatus(),
      refreshBranches(),
      refreshCommits(),
      refreshWorktrees(),
    ]);
  }, [refreshStatus, refreshBranches, refreshCommits, refreshWorktrees]);

  // Seleção
  const selectFile = useCallback((filePath: string | null) => {
    updateTabGit(tabId, { selectedFile: filePath, selectedDiff: null });
  }, [tabId, updateTabGit]);

  const clearSelection = useCallback(() => {
    updateTabGit(tabId, { selectedFile: null, selectedDiff: null });
  }, [tabId, updateTabGit]);

  return {
    // Estado
    status: git?.status ?? null,
    branches: git?.branches ?? [],
    commits: git?.commits ?? [],
    worktrees: git?.worktrees ?? [],
    selectedFile: git?.selectedFile ?? null,
    selectedDiff: git?.selectedDiff ?? null,
    isLoading: git?.isLoading ?? false,

    // Refresh
    refreshStatus,
    refreshBranches,
    refreshCommits,
    refreshWorktrees,
    refreshAll,

    // Stage/Unstage
    stageFile,
    unstageFile,
    stageAll,

    // Commit
    commit,

    // Push/Pull
    push,
    pull,

    // Diff
    getFileDiff,
    getAllDiff,

    // Branches
    checkoutBranch,
    createBranch,
    deleteBranch,

    // Worktrees
    openWorktreeInNewTab,
    addWorktree,
    removeWorktree,

    // Seleção
    selectFile,
    clearSelection,
  };
};
```

#### 2.2 Criar `src/hooks/useTabNavigation.ts`

```typescript
import { useCallback } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

type Page = 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup' | 'init-repo';

export const useTabNavigation = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTabNavigation } = useTabStore();

  const tab = getTab(tabId);
  const currentPage = tab?.navigation.currentPage ?? 'commits';

  const setPage = useCallback((page: Page) => {
    updateTabNavigation(tabId, page);
  }, [tabId, updateTabNavigation]);

  return {
    currentPage,
    setPage,
  };
};
```

#### 2.3 Criar `src/hooks/useTabMerge.ts`

```typescript
import { useCallback } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

export const useTabMerge = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTabMerge } = useTabStore();

  const tab = getTab(tabId);
  const merge = tab?.merge ?? { isMergeInProgress: false, conflictCount: 0 };

  const setMergeInProgress = useCallback((inProgress: boolean, count = 0) => {
    updateTabMerge(tabId, { isMergeInProgress: inProgress, conflictCount: count });
  }, [tabId, updateTabMerge]);

  return {
    isMergeInProgress: merge.isMergeInProgress,
    conflictCount: merge.conflictCount,
    setMergeInProgress,
  };
};
```

#### 2.4 Criar `src/hooks/useTabAi.ts`

```typescript
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from './useTabId';

export const useTabAi = () => {
  const tabId = useCurrentTabId();
  const contextKey = useContextKey();
  const { getTab, updateTabAi } = useTabStore();

  const tab = getTab(tabId);
  const ai = tab?.ai ?? { commitSuggestion: null, commitMessageDraft: '', isGenerating: false };

  const generateCommitMessage = useCallback(async (diff: string) => {
    updateTabAi(tabId, { isGenerating: true });
    try {
      const message = await invoke<string>('generate_commit_msg', { diff });
      updateTabAi(tabId, { commitSuggestion: message, isGenerating: false });
      return message;
    } catch (error) {
      console.error('Failed to generate commit message:', error);
      updateTabAi(tabId, { isGenerating: false });
      throw error;
    }
  }, [tabId, updateTabAi]);

  const setCommitMessageDraft = useCallback((draft: string) => {
    updateTabAi(tabId, { commitMessageDraft: draft });
  }, [tabId, updateTabAi]);

  const clearSuggestion = useCallback(() => {
    updateTabAi(tabId, { commitSuggestion: null });
  }, [tabId, updateTabAi]);

  return {
    commitSuggestion: ai.commitSuggestion,
    commitMessageDraft: ai.commitMessageDraft,
    isGenerating: ai.isGenerating,
    generateCommitMessage,
    setCommitMessageDraft,
    clearSuggestion,
  };
};
```

#### 2.5 Criar `src/hooks/useTabRepo.ts`

```typescript
import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { getWindowLabel } from './useWindowLabel';

export const useTabRepo = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTab } = useTabStore();

  const tab = getTab(tabId);

  const setRepository = useCallback(async (path: string) => {
    const windowLabel = getWindowLabel();
    const result = await invoke<{ is_git: boolean }>('set_repository', {
      path,
      windowLabel,
      tabId,
    });

    updateTab(tabId, {
      repoPath: path,
      repoState: result.is_git ? 'git' : 'no-git',
      title: path.split('/').pop() || 'Sem título',
    });

    return result;
  }, [tabId, updateTab]);

  const clearRepository = useCallback(async () => {
    const windowLabel = getWindowLabel();
    const contextKey = `${windowLabel}:${tabId}`;

    await invoke('unset_tab_repository', { contextKey });

    updateTab(tabId, {
      repoPath: null,
      repoState: 'none',
      title: 'Nova Aba',
    });
  }, [tabId, updateTab]);

  return {
    repoPath: tab?.repoPath ?? null,
    repoState: tab?.repoState ?? 'none',
    setRepository,
    clearRepository,
  };
};
```

---

### Fase 3: UI da Barra de Abas

**Objetivo:** Criar componentes visuais para as abas.

#### 3.1 Criar `src/components/TabBar.tsx`

```typescript
import React from 'react';
import { X, Plus } from 'lucide-react';
import { useTabStore, useTabs, useActiveTabId } from '@/stores/tabStore';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';

export const TabBar: React.FC = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const { createTab, closeTab, setActiveTab, tabOrder } = useTabStore();

  const handleNewTab = () => {
    createTab(null);
  };

  const handleCloseTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Se é a última aba, fecha a janela
    if (tabOrder.length === 1) {
      window.close();
      return;
    }

    closeTab(tabId);
  };

  return (
    <div className="flex h-10 items-center gap-1 border-b border-border1 bg-surface2 px-2">
      {/* Lista de abas */}
      <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.filter(Boolean).map((tab) => {
          const isActive = tab.tabId === activeTabId;

          return (
            <Tooltip key={tab.tabId} content={tab.repoPath || 'Nova Aba'} position="bottom" delay={500}>
              <button
                onClick={() => setActiveTab(tab.tabId)}
                className={cn(
                  'group relative flex h-8 min-w-[140px] max-w-[220px] items-center gap-2 rounded-t-lg px-3 text-sm transition-all',
                  isActive
                    ? 'bg-surface1 text-text1'
                    : 'text-text2 hover:bg-surface3/50 hover:text-text1'
                )}
              >
                {/* Indicador de aba ativa */}
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}

                {/* Indicador de estado (dirty, conflicts, etc.) */}
                {tab.git?.status && (
                  (tab.git.status.files?.some(f => f.staged || !f.staged) && (
                    <div className="h-2 w-2 rounded-full bg-warning" />
                  ))
                )}

                {/* Título da aba */}
                <span className="flex-1 truncate text-left font-medium">
                  {tab.title}
                </span>

                {/* Botão fechar */}
                <button
                  onClick={(e) => handleCloseTab(tab.tabId, e)}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded transition-all',
                    'opacity-0 group-hover:opacity-100',
                    'hover:bg-surface3 hover:text-danger'
                  )}
                  aria-label="Fechar aba"
                >
                  <X size={14} />
                </button>
              </button>
            </Tooltip>
          );
        })}
      </div>

      {/* Botão nova aba */}
      <Tooltip content="Nova aba (Cmd+T)" position="bottom">
        <button
          onClick={handleNewTab}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'text-text2 hover:bg-surface3 hover:text-text1'
          )}
          aria-label="Nova aba"
        >
          <Plus size={18} />
        </button>
      </Tooltip>
    </div>
  );
};
```

#### 3.2 Modificar `src/components/Layout.tsx`

Adicionar o TabBar:

```typescript
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';  // NOVO
import { SidebarInset, SidebarProvider } from '@/ui/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-bg text-text1">
        <AppSidebar />
        <SidebarInset>
          <TabBar />  {/* NOVO - acima do TopBar */}
          <TopBar />
          <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
            <div className="h-full w-full min-w-0">{children}</div>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};
```

---

### Fase 4: Ciclo de Vida e Integração

**Objetivo:** Integrar o sistema de abas no App.tsx e garantir o ciclo de vida correto.

#### 4.1 Modificar `src/App.tsx`

```typescript
import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Layout } from '@/components/Layout';
import { TabProvider } from '@/contexts/TabContext';
import { useTabStore, useActiveTabId } from '@/stores/tabStore';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useTabGit } from '@/hooks/useTabGit';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import { loadConfig } from '@/hooks/useConfig';
import { isTauri } from '@/lib/utils';

// Páginas
import { CommitsPage } from '@/pages/CommitsPage';
import { BranchesPage } from '@/pages/BranchesPage';
import { ConflictResolverPage } from '@/pages/ConflictResolverPage';
import { SetupPage } from '@/pages/SetupPage';
import { InitRepoPage } from '@/pages/InitRepoPage';

// Conteúdo de uma aba (renderizado dentro do TabProvider)
const TabContent: React.FC = () => {
  const { currentPage } = useTabNavigation();
  const { repoPath, repoState, setRepository } = useTabRepo();
  const { refreshAll } = useTabGit();

  // Carregar dados Git quando a aba tem repositório
  useEffect(() => {
    if (repoState === 'git') {
      refreshAll();
    }
  }, [repoState, refreshAll]);

  // Renderizar página apropriada
  const renderPage = () => {
    if (repoState === 'none') {
      return <SetupPage />;
    }
    if (repoState === 'no-git') {
      return <InitRepoPage />;
    }

    switch (currentPage) {
      case 'branches':
        return <BranchesPage />;
      case 'conflict-resolver':
        return <ConflictResolverPage />;
      case 'history':
        return <div className="p-4 text-text2">Página de histórico em breve.</div>;
      case 'commits':
      default:
        return <CommitsPage />;
    }
  };

  return renderPage();
};

export const App: React.FC = () => {
  const { tabs, tabOrder, activeTabId, createTab } = useTabStore();
  const windowLabel = getWindowLabel();

  // Inicialização: criar aba inicial se não existir
  useEffect(() => {
    const initializeTabs = async () => {
      if (tabOrder.length === 0) {
        // Primeira execução: criar aba inicial
        const tabId = createTab(null);

        // Tentar restaurar último repositório
        if (isTauri()) {
          try {
            const config = await loadConfig();
            if (config?.last_repo_path) {
              const contextKey = `${windowLabel}:${tabId}`;
              const result = await invoke<{ is_git: boolean }>('set_repository', {
                path: config.last_repo_path,
                windowLabel,
                tabId,
              });

              useTabStore.getState().updateTab(tabId, {
                repoPath: config.last_repo_path,
                repoState: result.is_git ? 'git' : 'no-git',
                title: config.last_repo_path.split('/').pop() || 'Repositório',
              });
            }
          } catch (error) {
            console.error('Failed to restore last repository:', error);
          }
        }
      } else {
        // Restaurar repositórios das abas persistidas
        for (const tabId of tabOrder) {
          const tab = tabs[tabId];
          if (tab?.repoPath && isTauri()) {
            try {
              await invoke('set_repository', {
                path: tab.repoPath,
                windowLabel,
                tabId,
              });
            } catch (error) {
              console.error(`Failed to restore repository for tab ${tabId}:`, error);
            }
          }
        }
      }
    };

    initializeTabs();
  }, []); // Apenas na montagem inicial

  // Cleanup ao fechar janela
  useEffect(() => {
    if (!isTauri()) return;

    const handleBeforeUnload = () => {
      // Limpar todas as abas do backend
      for (const tabId of tabOrder) {
        const contextKey = `${windowLabel}:${tabId}`;
        invoke('unset_tab_repository', { contextKey }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [windowLabel, tabOrder]);

  // Se não há aba ativa, mostrar loading
  if (!activeTabId || !tabs[activeTabId]) {
    return (
      <Layout>
        <div className="flex h-full items-center justify-center">
          <div className="text-text2">Carregando...</div>
        </div>
      </Layout>
    );
  }

  return (
    <TabProvider tabId={activeTabId}>
      <Layout>
        <TabContent />
      </Layout>
    </TabProvider>
  );
};
```

#### 4.2 Atualizar componentes que usam stores antigos

Todos os componentes que usavam `useGitStore`, `useRepoStore`, `useNavigationStore`, etc., precisam ser atualizados para usar os novos hooks:

**Antes:**
```typescript
import { useGitStore } from '@/stores/gitStore';
import { useNavigationStore } from '@/stores/navigationStore';

const MyComponent = () => {
  const { status, refreshStatus } = useGitStore();
  const { currentPage, setPage } = useNavigationStore();
  // ...
};
```

**Depois:**
```typescript
import { useTabGit } from '@/hooks/useTabGit';
import { useTabNavigation } from '@/hooks/useTabNavigation';

const MyComponent = () => {
  const { status, refreshStatus } = useTabGit();
  const { currentPage, setPage } = useTabNavigation();
  // ...
};
```

Componentes que precisam ser atualizados:
- `src/components/TopBar.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/CommitsPage/*`
- `src/pages/BranchesPage/*`
- Todos os componentes que acessam estado Git/navegação

---

### Fase 5: Integração Worktrees

**Objetivo:** Worktrees sempre abrem em nova aba.

#### 5.1 Atualizar `BranchesListPanel.tsx`

Remover opção de abrir em nova janela, manter apenas nova aba:

```typescript
// Antes: openWorktreeWindow(path, branch)
// Depois: openWorktreeInNewTab(path, branch)

const handleOpenWorktree = async (worktree: Worktree) => {
  await openWorktreeInNewTab(worktree.path, worktree.branch);
};
```

#### 5.2 Remover comando `open_worktree_window_cmd` (opcional)

Se não for mais necessário abrir worktrees em janelas separadas, o comando pode ser removido do backend.

---

## Testes Manuais

### Cenário 1: Criação e navegação de abas
1. Abrir app → deve criar aba inicial
2. Clicar "+" → deve criar nova aba
3. Clicar em aba diferente → deve trocar contexto
4. Verificar que estado é preservado ao voltar

### Cenário 2: Isolamento de estado
1. Abrir repo A na aba 1
2. Criar aba 2, abrir repo B
3. Stage arquivo em aba 1
4. Trocar para aba 2 → não deve ter arquivo staged
5. Voltar para aba 1 → arquivo ainda deve estar staged

### Cenário 3: Worktrees
1. Criar worktree
2. Clicar para abrir → deve criar nova aba
3. Nova aba deve ter contexto do worktree

### Cenário 4: Fechar abas
1. Com 2 abas abertas, fechar uma → deve ativar a outra
2. Com 1 aba, fechar → deve fechar janela

### Cenário 5: Persistência
1. Abrir múltiplas abas com diferentes repos
2. Fechar app
3. Reabrir → abas devem ser restauradas

---

## Estimativas de Tempo

| Fase | Estimativa |
|------|------------|
| Fase 1: Infraestrutura | 2-3 horas |
| Fase 2: Stores Scoped | 3-4 horas |
| Fase 3: UI TabBar | 2-3 horas |
| Fase 4: Ciclo de Vida | 2-3 horas |
| Fase 5: Worktrees | 1-2 horas |
| **Total** | **10-15 horas** |

---

## Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Vazamento de memória com muitas abas | Alto | Limite de 10 abas + cleanup agressivo |
| Confusão de estado entre abas | Alto | Logs detalhados durante dev + testes unitários para tabStore |
| Quebra de funcionalidades existentes | Alto | Feature branch + testes de regressão antes de merge |
| Persistência incorreta ao reabrir | Médio | Só persistir metadados, recarregar Git ao ativar aba |
| Performance com muitas abas | Médio | Lazy loading do estado Git (só carrega quando aba ativa) |

---

## Checklist Final

- [ ] Fase 1 completa e testada
- [ ] Fase 2 completa e testada
- [ ] Fase 3 completa e testada
- [ ] Fase 4 completa e testada
- [ ] Fase 5 completa e testada
- [ ] Todos os componentes atualizados para novos hooks
- [ ] Testes manuais passando
- [ ] Sem regressões nas funcionalidades existentes
- [ ] Performance aceitável com 5+ abas
- [ ] Persistência funcionando corretamente

---

**Criado em:** 2025-01-02
**Branch sugerida:** `feature/tabs-system`
