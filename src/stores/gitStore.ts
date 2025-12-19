import { create } from 'zustand';
import type { FileStatus, Branch, CommitInfo, RepoStatus } from '../types';

interface GitStore {
  status: RepoStatus | null;
  branches: Branch[];
  commits: CommitInfo[];
  selectedFile: string | null;
  selectedDiff: string | null;

  setStatus: (status: RepoStatus | null) => void;
  setBranches: (branches: Branch[]) => void;
  setCommits: (commits: CommitInfo[]) => void;
  setSelectedFile: (file: string | null) => void;
  setSelectedDiff: (diff: string | null) => void;
}

export const useGitStore = create<GitStore>((set) => ({
  status: null,
  branches: [],
  commits: [],
  selectedFile: null,
  selectedDiff: null,

  setStatus: (status) => set({ status }),
  setBranches: (branches) => set({ branches }),
  setCommits: (commits) => set({ commits }),
  setSelectedFile: (file) => set({ selectedFile: file }),
  setSelectedDiff: (diff) => set({ selectedDiff: diff }),
}));
