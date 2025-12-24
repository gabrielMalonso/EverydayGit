import { useCallback, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { isDemoMode } from '@/demo/demoMode';
import type { ConflictFile, ConflictHunk, HunkResolution, ResolutionChoice } from '@/types';

type ResolutionMap = Map<string, Map<number, HunkResolution>>;

type ResolvedFilesSet = Set<string>;

const buildResolvedContent = (conflictFile: ConflictFile, fileResolutions: Map<number, HunkResolution>) => {
  if (conflictFile.conflicts.length === 0) {
    return conflictFile.content;
  }

  const lines = conflictFile.content.split('\n');
  const outputLines: string[] = [];
  let inConflict = false;
  let hunkIndex = 0;

  for (const line of lines) {
    if (!inConflict && line.startsWith('<<<<<<<')) {
      const hunk = conflictFile.conflicts[hunkIndex];
      if (!hunk) {
        throw new Error('Conflict markers out of sync with parsed hunks.');
      }

      const resolution = fileResolutions.get(hunk.id);
      if (!resolution) {
        throw new Error(`Conflito ${hunkIndex + 1} ainda nao foi resolvido.`);
      }

      outputLines.push(...resolution.content.split('\n'));
      inConflict = true;
      continue;
    }

    if (inConflict) {
      if (line.startsWith('>>>>>>>')) {
        inConflict = false;
        hunkIndex += 1;
      }
      continue;
    }

    outputLines.push(line);
  }

  if (hunkIndex < conflictFile.conflicts.length) {
    throw new Error('Nem todos os conflitos foram resolvidos.');
  }

  return outputLines.join('\n');
};

export const useResolution = () => {
  const [resolutions, setResolutions] = useState<ResolutionMap>(new Map());
  const [resolvedFiles, setResolvedFiles] = useState<ResolvedFilesSet>(new Set());

  const applyResolution = useCallback(
    (filePath: string, hunk: ConflictHunk, choice: ResolutionChoice, customContent?: string) => {
      const content = (() => {
        switch (choice) {
          case 'ours':
            return hunk.ours_content;
          case 'theirs':
            return hunk.theirs_content;
          case 'both':
            return `${hunk.ours_content}${hunk.theirs_content}`;
          case 'custom':
          default:
            return customContent ?? '';
        }
      })();

      setResolutions((prev) => {
        const next = new Map(prev);
        const fileResolutions = new Map(next.get(filePath) ?? new Map());
        fileResolutions.set(hunk.id, {
          hunkId: hunk.id,
          choice,
          content,
        });
        next.set(filePath, fileResolutions);
        return next;
      });

      setResolvedFiles((prev) => {
        if (!prev.has(filePath)) return prev;
        const next = new Set(prev);
        next.delete(filePath);
        return next;
      });
    },
    [],
  );

  const getResolvedContent = useCallback(
    (filePath: string, hunkId: number) => {
      return resolutions.get(filePath)?.get(hunkId)?.content ?? '';
    },
    [resolutions],
  );

  const saveFile = useCallback(
    async (filePath: string, conflictFile: ConflictFile) => {
      if (conflictFile.is_binary) {
        throw new Error('Binary conflict files must be resolved manually.');
      }

      const fileResolutions = resolutions.get(filePath);
      if (!fileResolutions) {
        throw new Error('Nenhuma resolucao encontrada para este arquivo.');
      }

      const resolvedContent = buildResolvedContent(conflictFile, fileResolutions);

      if (!isDemoMode()) {
        await invoke('resolve_conflict_file_cmd', { filePath, resolvedContent });
      }

      setResolvedFiles((prev) => {
        const next = new Set(prev);
        next.add(filePath);
        return next;
      });

      return resolvedContent;
    },
    [resolutions],
  );

  const completeMerge = useCallback(async (message?: string) => {
    if (isDemoMode()) {
      return 'Demo: merge completed.';
    }

    return invoke<string>('complete_merge_cmd', { message });
  }, []);

  return {
    resolutions,
    resolvedFiles,
    applyResolution,
    getResolvedContent,
    saveFile,
    completeMerge,
  };
};
