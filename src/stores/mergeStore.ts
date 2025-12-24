import { create } from 'zustand';

interface MergeState {
  isMergeInProgress: boolean;
  conflictCount: number;
  setMergeInProgress: (inProgress: boolean, count?: number) => void;
}

export const useMergeStore = create<MergeState>((set) => ({
  isMergeInProgress: false,
  conflictCount: 0,
  setMergeInProgress: (inProgress, count = 0) =>
    set({
      isMergeInProgress: inProgress,
      conflictCount: inProgress ? count : 0,
    }),
}));
