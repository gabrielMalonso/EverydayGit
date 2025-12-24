import { useMemo } from 'react';
import type { BranchComparison, MergePreview } from '@/types';

interface UseMergeMetricsParams {
  sourceBranch: string | null;
  targetBranch: string | null;
  currentBranch: string | null | undefined;
  comparison: BranchComparison | null;
  preview: MergePreview | null;
  loading: boolean;
}

export const useMergeMetrics = ({
  sourceBranch,
  targetBranch,
  currentBranch,
  comparison,
  preview,
  loading,
}: UseMergeMetricsParams) => {
  return useMemo(() => {
    const isSameBranch = Boolean(sourceBranch && targetBranch && sourceBranch === targetBranch);
    const isMergeReady = Boolean(sourceBranch && targetBranch && !isSameBranch);
    const isTargetNotCurrent = Boolean(targetBranch && currentBranch && targetBranch !== currentBranch);
    const hasNoCommits = Boolean(isMergeReady && comparison && comparison.ahead === 0);
    const hasConflicts = Boolean(preview && preview.conflicts.length > 0);
    const aheadLabel = comparison ? comparison.ahead : '-';
    const behindLabel = comparison ? comparison.behind : '-';
    const filesChangedLabel = preview ? String(preview.files_changed) : '-';
    const insertionsLabel = preview ? String(preview.insertions) : '-';
    const deletionsLabel = preview ? String(preview.deletions) : '-';
    const conflictsLabel = preview
      ? preview.conflicts.length > 0
        ? String(preview.conflicts.length)
        : 'Nenhum'
      : '-';
    const mergeDisabled = !isMergeReady || loading || hasNoCommits;

    return {
      isSameBranch,
      isTargetNotCurrent,
      hasNoCommits,
      hasConflicts,
      aheadLabel,
      behindLabel,
      filesChangedLabel,
      insertionsLabel,
      deletionsLabel,
      conflictsLabel,
      mergeDisabled,
    };
  }, [
    sourceBranch,
    targetBranch,
    currentBranch,
    comparison,
    preview,
    loading,
  ]);
};
