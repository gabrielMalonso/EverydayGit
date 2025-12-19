import { invoke } from '@tauri-apps/api/core';
import { useAiStore } from '../stores/aiStore';
import type { ChatMessage } from '../types';

export const useAi = () => {
  const { setCommitSuggestion, setIsGenerating, addChatMessage } = useAiStore();

  const generateCommitMessage = async (diff: string) => {
    setIsGenerating(true);
    try {
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

  return {
    generateCommitMessage,
    chat,
  };
};
