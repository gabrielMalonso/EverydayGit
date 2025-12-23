import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Branch } from '@/types';

interface UseDefaultBranchSelectionParams {
  branches: Branch[];
  selectedBranch: string | null;
  setSelectedBranch: Dispatch<SetStateAction<string | null>>;
}

export const useDefaultBranchSelection = ({
  branches,
  selectedBranch,
  setSelectedBranch,
}: UseDefaultBranchSelectionParams) => {
  useEffect(() => {
    if (selectedBranch) return;
    const current = branches.find((branch) => branch.current);
    if (current) {
      setSelectedBranch(current.name);
    } else if (branches[0]) {
      setSelectedBranch(branches[0].name);
    }
  }, [branches, selectedBranch, setSelectedBranch]);
};
