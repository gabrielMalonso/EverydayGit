import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import { demoConflictFiles } from '@/demo/fixtures';
import { useRepoStore } from '@/stores/repoStore';

export const useConflictFiles = () => {
  const { repoPath } = useRepoStore();
  const [conflictFiles, setConflictFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!repoPath && !isDemoMode()) {
      setConflictFiles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      if (isDemoMode()) {
        setConflictFiles(demoConflictFiles);
      } else {
        const files = await invoke<string[]>('get_conflict_files_cmd');
        setConflictFiles(files);
      }
    } catch (error) {
      console.error('Failed to get conflict files:', error);
      setConflictFiles([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { conflictFiles, isLoading, refresh };
};
