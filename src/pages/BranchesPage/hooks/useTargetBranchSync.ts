import { useEffect, useRef } from 'react';
import type { Dispatch, SetStateAction } from 'react';

interface UseTargetBranchSyncParams {
  currentBranch: string | null | undefined;
  targetBranch: string | null;
  setTargetBranch: Dispatch<SetStateAction<string | null>>;
}

export const useTargetBranchSync = ({
  currentBranch,
  targetBranch,
  setTargetBranch,
}: UseTargetBranchSyncParams) => {
  const previousCurrentRef = useRef<string | null>(null);

  useEffect(() => {
    const previousCurrent = previousCurrentRef.current;
    if (currentBranch && (targetBranch === null || targetBranch === previousCurrent)) {
      setTargetBranch(currentBranch);
    }
    previousCurrentRef.current = currentBranch ?? null;
  }, [currentBranch, targetBranch, setTargetBranch]);
};
