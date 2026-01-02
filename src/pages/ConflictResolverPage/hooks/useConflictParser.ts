import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import { demoConflictData } from '@/demo/fixtures';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import type { ConflictFile } from '@/types';

export const useConflictParser = () => {
  const [conflictData, setConflictData] = useState<ConflictFile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const windowLabel = getWindowLabel();

  const parseFile = useCallback(async (filePath: string) => {
    setIsLoading(true);
    try {
      if (isDemoMode()) {
        setConflictData(demoConflictData[filePath] ?? null);
      } else {
        const data = await invoke<ConflictFile>('parse_conflict_file_cmd', { filePath, windowLabel });
        setConflictData(data);
      }
    } catch (error) {
      console.error('Failed to parse conflict file:', error);
      setConflictData(null);
    } finally {
      setIsLoading(false);
    }
  }, [windowLabel]);

  return { conflictData, isLoading, parseFile };
};
