import { create } from 'zustand';
import type { ChatMessage } from '../types';

interface AiStore {
  commitSuggestion: string | null;
  commitMessageDraft: string;
  isGenerating: boolean;
  chatMessages: ChatMessage[];

  setCommitSuggestion: (suggestion: string | null) => void;
  setCommitMessageDraft: (draft: string) => void;
  setIsGenerating: (generating: boolean) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
}

export const useAiStore = create<AiStore>((set) => ({
  commitSuggestion: null,
  commitMessageDraft: '',
  isGenerating: false,
  chatMessages: [],

  setCommitSuggestion: (suggestion) => set({ commitSuggestion: suggestion }),
  setCommitMessageDraft: (draft) => set({ commitMessageDraft: draft }),
  setIsGenerating: (generating) => set({ isGenerating: generating }),
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  clearChat: () => set({ chatMessages: [] }),
}));
