import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from './Panel';
import { Button } from '../ui';
import { Textarea } from './Textarea';
import { useTabAi } from '@/hooks/useTabAi';
import { useTabGit } from '@/hooks/useTabGit';

export const AiPanel: React.FC = () => {
  const { t } = useTranslation('common');
  const { commitSuggestion, isGenerating, chatMessages, addChatMessage, generateCommitMessage, chat } = useTabAi();
  const { getAllDiff } = useTabGit();
  const [chatInput, setChatInput] = useState('');

  const handleGenerateCommit = async () => {
    try {
      const diff = await getAllDiff(true);
      if (!diff || diff.trim() === '') {
        alert(t('ai.commitGenerator.noStagedChanges'));
        return;
      }
      await generateCommitMessage(diff);
    } catch (error) {
      alert(t('ai.commitGenerator.generationFailed'));
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
      alert(t('ai.chat.sendFailed'));
    }
  };

  return (
    <Panel title={t('ai.title')} className="h-full">
      <div className="flex h-full flex-col gap-4 p-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-text1">{t('ai.commitGenerator.title')}</h4>
            <Button onClick={handleGenerateCommit} size="sm" disabled={isGenerating}>
              {isGenerating ? t('ai.commitGenerator.generating') : t('actions.generate')}
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
          <h4 className="text-sm font-semibold text-text1">{t('ai.chat.title')}</h4>

          <div className="flex-1 space-y-2 overflow-auto rounded-card-inner border border-border1 bg-surface2/50 p-3">
            {chatMessages.length === 0 ? (
              <p className="text-sm text-text3">{t('ai.chat.placeholder')}</p>
            ) : (
              chatMessages.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-primary' : 'text-text1'}`}>
                  <span className="font-semibold">{msg.role === 'user' ? t('ai.chat.you') : t('ai.chat.ai')}:</span>{' '}
                  {msg.content}
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={t('ai.chat.inputPlaceholder')}
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
              {t('ai.chat.send')}
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
