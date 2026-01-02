import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import { demoConflictFiles } from '@/demo/fixtures';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import { useRepoStore } from '@/stores/repoStore';

export const useConflictFiles = () => {
  const { repoPath, repoState } = useRepoStore();
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const windowLabel = getWindowLabel();

  const refresh = useCallback(async () => {
    if ((!repoPath || repoState !== 'git') && !isDemoMode()) {
      setConflictFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode()) {
        setConflictFiles(demoConflictFiles);
      } else {
        const files = await invoke<string[]>('get_conflict_files_cmd', { windowLabel });
        setConflictFiles(files);
      }
    } catch (error) {
      console.error('Failed to get conflict files:', error);
      setConflictFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoPath, repoState, windowLabel]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conflictFiles, isLoading, refresh };
};
