import { create } from 'zustand';

interface RepoStore {
  repoPath: string | null;
  setRepoPath: (path: string | null) => void;
}

export const useRepoStore = create<RepoStore>((set) => ({
  repoPath: null,
  setRepoPath: (path) => set({ repoPath: path }),
}));
