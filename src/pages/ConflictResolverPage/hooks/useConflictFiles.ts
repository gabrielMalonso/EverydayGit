import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import { demoConflictFiles } from '@/demo/fixtures';
import { useContextKey } from '@/hooks/useTabId';
import { useTabRepo } from '@/hooks/useTabRepo';

export const useConflictFiles = () => {
  const { repoPath, repoState } = useTabRepo();
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const contextKey = useContextKey();

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
        const files = await invoke<string[]>('get_conflict_files_cmd', { contextKey });
        setConflictFiles(files);
      }
    } catch (error) {
      console.error('Failed to get conflict files:', error);
      setConflictFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoPath, repoState, contextKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conflictFiles, isLoading, refresh };
};
