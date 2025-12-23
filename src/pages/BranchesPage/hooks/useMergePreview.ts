import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { BranchComparison, MergePreview } from '@/types';

type CompareBranchesFn = (targetBranch: string, sourceBranch: string) => Promise<BranchComparison>;
type MergePreviewFn = (sourceBranch: string, targetBranch: string) => Promise<MergePreview>;

interface UseMergePreviewParams {
  sourceBranch: string | null;
  targetBranch: string | null;
  compareBranches: CompareBranchesFn;
  mergePreview: MergePreviewFn;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

export const useMergePreview = ({
  sourceBranch,
  targetBranch,
  compareBranches,
  mergePreview,
  setLoading,
}: UseMergePreviewParams) => {
  const [comparison, setComparison] = useState<BranchComparison | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);

  useEffect(() => {
    let active = true;
    const runPreview = async () => {
      setComparison(null);
      setPreview(null);
      if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [nextComparison, nextPreview] = await Promise.all([
          compareBranches(targetBranch, sourceBranch),
          mergePreview(sourceBranch, targetBranch),
        ]);
        if (!active) return;
        setComparison(nextComparison);
        setPreview(nextPreview);
      } catch (error) {
        if (active) {
          console.error('Failed to compare branches or preview merge', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    runPreview();
    return () => {
      active = false;
    };
  }, [sourceBranch, targetBranch, compareBranches, mergePreview, setLoading]);

  const clearPreview = () => {
    setPreview(null);
  };

  return { comparison, preview, clearPreview };
};
