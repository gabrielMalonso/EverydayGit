import React, { useState } from 'react';
import { Panel } from './Panel';
import { Button } from '../ui';
import { Textarea } from './Textarea';
import { useAiStore } from '../stores/aiStore';
import { useGit } from '../hooks/useGit';
import { useAi } from '../hooks/useAi';

export const AiPanel: React.FC = () => {
  const { commitSuggestion, isGenerating, chatMessages, addChatMessage } = useAiStore();
  const { getAllDiff } = useGit();
  const { generateCommitMessage, chat } = useAi();
  const [chatInput, setChatInput] = useState('');

  const handleGenerateCommit = async () => {
    try {
      const diff = await getAllDiff(true);
      if (!diff || diff.trim() === '') {
        alert('No staged changes to generate commit message from');
        return;
      }
      await generateCommitMessage(diff);
    } catch (error) {
      alert(`Failed to generate commit message: ${error}`);
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMessage = { role: 'user', content: chatInput };
    addChatMessage(userMessage);
    setChatInput('');

    try {
      await chat([...chatMessages, userMessage]);
    } catch (error) {
      alert(`Failed to send message: ${error}`);
    }
  };

  return (
    <Panel title="AI Assistant" className="h-full">
      <div className="flex h-full flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text1">Commit Message Generator</h4>
            <Button onClick={handleGenerateCommit} size="sm" disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>

          {commitSuggestion && (
            <div className="rounded-card-inner border border-border1 bg-surface2/60 p-3">
              <p className="whitespace-pre-wrap text-sm text-text1">{commitSuggestion}</p>
            </div>
          )}
        </div>

        <div className="border-t border-border1" />

        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <h4 className="text-sm font-semibold text-text1">AI Chat</h4>

          <div className="flex-1 space-y-2 overflow-auto rounded-card-inner border border-border1 bg-surface2/50 p-3">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-text3">Ask me anything about your repository...</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-primary' : 'text-text1'}`}>
                  <span className="font-semibold">{msg.role === 'user' ? 'You' : 'AI'}:</span>{' '}
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type a message..."
              rows={2}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button onClick={handleSendMessage} disabled={!chatInput.trim() || isGenerating}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
