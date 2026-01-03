import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { getWindowLabel } from './useWindowLabel';
import { isDemoMode, isTauriRuntime } from '@/demo/demoMode';
import type { RepoSelectionResult } from '@/types';

export const useTabRepo = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTab } = useTabStore();

  const tab = getTab(tabId);

  const setRepository = useCallback(
    async (path: string) => {
      const title = path.split(/[\\/]/).pop() || 'Sem titulo';

      if (isDemoMode() || !isTauriRuntime()) {
        updateTab(tabId, { repoPath: path, repoState: 'git', title });
        return { is_git: true, path } as RepoSelectionResult;
      }

      const windowLabel = getWindowLabel();
      const result = await invoke<RepoSelectionResult>('set_repository', {
        path,
        windowLabel,
        tabId,
      });

      updateTab(tabId, {
        repoPath: path,
        repoState: result.is_git ? 'git' : 'no-git',
        title,
      });

      return result;
    },
    [tabId, updateTab],
  );

  const clearRepository = useCallback(async () => {
    if (isTauriRuntime()) {
      const windowLabel = getWindowLabel();
      const contextKey = `${windowLabel}:${tabId}`;
      await invoke('unset_tab_repository', { contextKey });
    }

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
