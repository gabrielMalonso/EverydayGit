import { create } from 'zustand';

interface RenameModalState {
    isOpen: boolean;
    tabId: string | null;
    currentTitle: string;
    openModal: (tabId: string, currentTitle: string) => void;
    closeModal: () => void;
}

export const useRenameModalStore = create<RenameModalState>((set, get) => ({
    isOpen: false,
    tabId: null,
    currentTitle: '',
    openModal: (tabId, currentTitle) => {
        console.log('[renameModalStore] openModal', { tabId, currentTitle });
        set({ isOpen: true, tabId, currentTitle });
    },
    closeModal: () => {
        console.log('[renameModalStore] closeModal');
        set({ isOpen: false, tabId: null, currentTitle: '' });
    },
}));

// Log state changes
useRenameModalStore.subscribe((state) => {
    console.log('[renameModalStore] State changed:', { isOpen: state.isOpen, tabId: state.tabId, currentTitle: state.currentTitle });
});
