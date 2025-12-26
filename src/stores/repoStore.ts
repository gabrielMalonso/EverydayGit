import { create } from 'zustand';

export type RepoState = 'none' | 'git' | 'no-git';

interface RepoStore {
  repoPath: string | null;
  repoState: RepoState;
  setRepoPath: (path: string | null) => void;
  setRepoState: (state: RepoState) => void;
  setRepoSelection: (path: string | null, state: RepoState) => void;
}

export const useRepoStore = create<RepoStore>((set) => ({
  repoPath: null,
  repoState: 'none',
  setRepoPath: (path) => set({ repoPath: path }),
  setRepoState: (state) => set({ repoState: state }),
  setRepoSelection: (path, state) => set({ repoPath: path, repoState: state }),
}));
