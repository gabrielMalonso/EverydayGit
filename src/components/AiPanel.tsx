import React, { useState } from 'react';
import { Panel } from './Panel';
import { Button } from './Button';
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
      <div className="flex flex-col h-full p-4 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text-primary">
              Commit Message Generator
            </h4>
            <Button
              onClick={handleGenerateCommit}
              size="sm"
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate'}
            </Button>
          </div>

          {commitSuggestion && (
            <div className="bg-bg-elevated border border-border rounded p-3">
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {commitSuggestion}
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-border"></div>

        <div className="flex-1 flex flex-col gap-2 min-h-0">
          <h4 className="text-sm font-semibold text-text-primary">
            AI Chat
          </h4>

          <div className="flex-1 overflow-auto bg-bg-elevated border border-border rounded p-3 space-y-2">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-text-secondary">
                Ask me anything about your repository...
              </p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`text-sm ${
                    msg.role === 'user'
                      ? 'text-accent'
                      : 'text-text-primary'
                  }`}
                >
                  <span className="font-semibold">
                    {msg.role === 'user' ? 'You' : 'AI'}:
                  </span>{' '}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!chatInput.trim() || isGenerating}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
