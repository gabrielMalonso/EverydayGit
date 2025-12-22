import { create } from 'zustand';

const STORAGE_KEY = 'gitflow-ai.sidebar.collapsed';

const getInitialCollapsed = () => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

interface SidebarState {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set, get) => ({
  collapsed: getInitialCollapsed(),
  setCollapsed: (collapsed) => {
    set({ collapsed });
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore persistence errors
    }
  },
  toggle: () => {
    const next = !get().collapsed;
    set({ collapsed: next });
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // ignore persistence errors
    }
  },
}));
