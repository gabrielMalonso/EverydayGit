import { create } from 'zustand';

type Page = 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup' | 'init-repo';

interface NavigationState {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'commits',
  setPage: (page) => set({ currentPage: page }),
}));
