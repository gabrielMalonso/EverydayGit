import { create } from 'zustand';
import type { Branch, CommitInfo, RepoStatus, Worktree } from '../types';

interface GitStore {
  status: RepoStatus | null;
  branches: Branch[];
  worktrees: Worktree[];
  commits: CommitInfo[];
  selectedFile: string | null;
  selectedDiff: string | null;

  setStatus: (status: RepoStatus | null) => void;
  setBranches: (branches: Branch[]) => void;
  setWorktrees: (worktrees: Worktree[]) => void;
  setCommits: (commits: CommitInfo[]) => void;
  setSelectedFile: (file: string | null) => void;
  setSelectedDiff: (diff: string | null) => void;
  reset: () => void;
}

export const useGitStore = create<GitStore>((set) => ({
  status: null,
  branches: [],
  worktrees: [],
  commits: [],
  selectedFile: null,
  selectedDiff: null,

  setStatus: (status) => set({ status }),
  setBranches: (branches) => set({ branches }),
  setWorktrees: (worktrees) => set({ worktrees }),
  setCommits: (commits) => set({ commits }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setSelectedDiff: (diff) => set({ selectedDiff: diff }),
  reset: () =>
    set({
      status: null,
      branches: [],
      worktrees: [],
      commits: [],
      selectedFile: null,
      selectedDiff: null,
    }),
}));
