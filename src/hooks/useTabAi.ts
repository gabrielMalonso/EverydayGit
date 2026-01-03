import { invoke } from '@tauri-apps/api/core';
import { useCallback } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import type { ChatMessage } from '@/types';
import { isDemoMode } from '@/demo/demoMode';

interface AnalyzeMergeParams {
  sourceBranch: string;
  targetBranch: string;
  conflicts: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export const useTabAi = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTabAi } = useTabStore();

  const tab = getTab(tabId);
  const ai = tab?.ai ?? {
    commitSuggestion: null,
    commitMessageDraft: '',
    isGenerating: false,
    chatMessages: [],
  };

  const addChatMessage = useCallback(
    (message: ChatMessage) => {
      const current = useTabStore.getState().getTab(tabId);
      const chatMessages = current?.ai.chatMessages ?? [];
      updateTabAi(tabId, { chatMessages: [...chatMessages, message] });
    },
    [tabId, updateTabAi],
  );

  const clearChat = useCallback(() => {
    updateTabAi(tabId, { chatMessages: [] });
  }, [tabId, updateTabAi]);

  const generateCommitMessage = useCallback(
    async (diff: string) => {
      updateTabAi(tabId, { isGenerating: true });
      try {
        if (isDemoMode()) {
          await new Promise((resolve) => setTimeout(resolve, 450));
          const suggestion =
            diff && diff.trim()
              ? 'feat(ui): polish desktop layout with token-based components'
              : 'chore: update documentation and tooling';
          updateTabAi(tabId, { commitSuggestion: suggestion });
          return suggestion;
        }
        const suggestion = await invoke<string>('generate_commit_msg', { diff });
        updateTabAi(tabId, { commitSuggestion: suggestion });
        return suggestion;
      } catch (error) {
        console.error('Failed to generate commit message:', error);
        throw error;
      } finally {
        updateTabAi(tabId, { isGenerating: false });
      }
    },
    [tabId, updateTabAi],
  );

  const chat = useCallback(
    async (messages: ChatMessage[]) => {
      updateTabAi(tabId, { isGenerating: true });
      try {
        if (isDemoMode()) {
          await new Promise((resolve) => setTimeout(resolve, 500));
          const last = messages[messages.length - 1]?.content || '';
          const response =
            last.toLowerCase().includes('commit')
              ? 'In demo mode, I can suggest a conventional commit based on the staged diff.'
              : 'Demo mode is active: I can help refine the UI/UX and simulate git/AI interactions in the browser.';
          addChatMessage({ role: 'assistant', content: response });
          return response;
        }
        const response = await invoke<string>('ai_chat', { messages });
        addChatMessage({ role: 'assistant', content: response });
        return response;
      } catch (error) {
        console.error('Failed to chat with AI:', error);
        throw error;
      } finally {
        updateTabAi(tabId, { isGenerating: false });
      }
    },
    [addChatMessage, tabId, updateTabAi],
  );

  const analyzeMerge = useCallback(
    async (params: AnalyzeMergeParams): Promise<string> => {
      if (isDemoMode()) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        return 'Demo: Os conflitos detectados envolvem arquivos de configuração e componentes UI. Recomendo resolver primeiro os arquivos de config (menor risco) e depois os componentes. Faça backup antes de prosseguir.';
      }

      return await invoke<string>('analyze_merge_cmd', {
        sourceBranch: params.sourceBranch,
        targetBranch: params.targetBranch,
        conflicts: params.conflicts,
        filesChanged: params.filesChanged,
        insertions: params.insertions,
        deletions: params.deletions,
      });
    },
    [],
  );

  const setCommitMessageDraft = useCallback(
    (draft: string) => {
      updateTabAi(tabId, { commitMessageDraft: draft });
    },
    [tabId, updateTabAi],
  );

  const clearSuggestion = useCallback(() => {
    updateTabAi(tabId, { commitSuggestion: null });
  }, [tabId, updateTabAi]);

  return {
    commitSuggestion: ai.commitSuggestion,
    commitMessageDraft: ai.commitMessageDraft,
    isGenerating: ai.isGenerating,
    chatMessages: ai.chatMessages,
    generateCommitMessage,
    chat,
    analyzeMerge,
    setCommitMessageDraft,
    clearSuggestion,
    addChatMessage,
    clearChat,
  };
};
