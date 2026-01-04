import { create } from 'zustand';

interface RenameModalState {
    isOpen: boolean;
    tabId: string | null;
    currentTitle: string;
    openModal: (tabId: string, currentTitle: string) => void;
    closeModal: () => void;
}

export const useRenameModalStore = create<RenameModalState>((set) => ({
    isOpen: false,
    tabId: null,
    currentTitle: '',
    openModal: (tabId, currentTitle) => {
        set({ isOpen: true, tabId, currentTitle });
    },
    closeModal: () => {
        set({ isOpen: false, tabId: null, currentTitle: '' });
    },
}));
