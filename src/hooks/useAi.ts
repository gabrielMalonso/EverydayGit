import { invoke } from '@tauri-apps/api/core';
import { useAiStore } from '../stores/aiStore';
import type { ChatMessage } from '../types';
import { isDemoMode } from '../demo/demoMode';

interface AnalyzeMergeParams {
  sourceBranch: string;
  targetBranch: string;
  conflicts: string[];
  filesChanged: number;
  insertions: number;
  deletions: number;
}

export const useAi = () => {
  const { setCommitSuggestion, setIsGenerating, addChatMessage } = useAiStore();

  const generateCommitMessage = async (diff: string) => {
    setIsGenerating(true);
    try {
      if (isDemoMode()) {
        await new Promise((resolve) => setTimeout(resolve, 450));
        const suggestion =
          diff && diff.trim()
            ? 'feat(ui): polish desktop layout with token-based components'
            : 'chore: update documentation and tooling';
        setCommitSuggestion(suggestion);
        return suggestion;
      }
      const suggestion = await invoke<string>('generate_commit_msg', { diff });
      setCommitSuggestion(suggestion);
      return suggestion;
    } catch (error) {
      console.error('Failed to generate commit message:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const chat = async (messages: ChatMessage[]) => {
    setIsGenerating(true);
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
      setIsGenerating(false);
    }
  };

  const analyzeMerge = async (params: AnalyzeMergeParams): Promise<string> => {
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
  };

  return {
    generateCommitMessage,
    chat,
    analyzeMerge,
  };
};
