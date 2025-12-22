import { create } from 'zustand';

type Page = 'commits' | 'branches' | 'history';

interface NavigationState {
  currentPage: Page;
  setPage: (page: Page) => void;
}

export const useNavigationStore = create<NavigationState>((set) => ({
  currentPage: 'commits',
  setPage: (page) => set({ currentPage: page }),
}));
