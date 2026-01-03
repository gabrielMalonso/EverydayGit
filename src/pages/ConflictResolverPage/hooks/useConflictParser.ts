import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import { demoConflictData } from '@/demo/fixtures';
import { useContextKey } from '@/hooks/useTabId';
import type { ConflictFile } from '@/types';

export const useConflictParser = () => {
  const [conflictData, setConflictData] = useState<ConflictFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const contextKey = useContextKey();

  const parseFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    try {
      if (isDemoMode()) {
        setConflictData(demoConflictData[filePath] ?? null);
      } else {
        const data = await invoke<ConflictFile>('parse_conflict_file_cmd', { filePath, contextKey });
        setConflictData(data);
      }
    } catch (error) {
      console.error('Failed to parse conflict file:', error);
      setConflictData(null);
    } finally {
      setIsLoading(false);
    }
  }, [contextKey]);

  return { conflictData, isLoading, parseFile };
};
