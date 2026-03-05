import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Branch } from '@/types';

interface UseDefaultBranchSelectionParams {
  branches: Branch[];
  selectedBranch: string | null;
  setSelectedBranch: Dispatch<SetStateAction<string | null>>;
}

const normalizeSelectionName = (branch: Branch) => (branch.remote ? branch.name : branch.name.replace(/^\+ /, ''));

export const useDefaultBranchSelection = ({
  branches,
  selectedBranch,
  setSelectedBranch,
}: UseDefaultBranchSelectionParams) => {
  useEffect(() => {
    if (selectedBranch) return;
    const firstLocalNonCurrent = branches.find((branch) => !branch.remote && !branch.current);
    const firstNonCurrent = branches.find((branch) => !branch.current);
    if (firstLocalNonCurrent) {
      setSelectedBranch(normalizeSelectionName(firstLocalNonCurrent));
      return;
    }
    if (firstNonCurrent) {
      setSelectedBranch(normalizeSelectionName(firstNonCurrent));
    }
  }, [branches, selectedBranch, setSelectedBranch]);
};
