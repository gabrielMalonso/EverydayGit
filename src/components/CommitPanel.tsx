import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from './Panel';
import { Button } from '../ui';
import { Textarea } from './Textarea';
import { useGitStore } from '../stores/gitStore';
import { useAiStore } from '../stores/aiStore';
import { useGit } from '../hooks/useGit';
import { useAi } from '../hooks/useAi';

interface CommitPanelProps {
  className?: string;
}

export const CommitPanel: React.FC<CommitPanelProps> = ({ className = '' }) => {
  const { status } = useGitStore();
  const { commitSuggestion, isGenerating } = useAiStore();
  const { commit, getAllDiff } = useGit();
  const { generateCommitMessage } = useAi();

  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    if (commitSuggestion) setCommitMessage(commitSuggestion);
  }, [commitSuggestion]);

  const stagedCount = useMemo(() => status?.files.filter((file) => file.staged).length ?? 0, [status]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    try {
      await commit(commitMessage);
      setCommitMessage('');
    } catch {
      // Toast já exibe o erro
    }
  };

  const handleGenerateCommit = async () => {
    try {
      const diff = await getAllDiff(true);
      if (!diff || diff.trim() === '') return;
      await generateCommitMessage(diff);
    } catch {
      // Toast já exibe o erro
    }
  };

  return (
    <Panel
      title="Commit"
      className={className}
      collapsible
      collapseKey="commit"
      actions={
        <div className="flex items-center gap-3">
          <span className="text-xs text-text3">
            {stagedCount > 0 ? `${stagedCount} staged` : 'No staged changes'}
          </span>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleCommit}
              size="sm"
              disabled={stagedCount === 0 || !commitMessage.trim() || isGenerating}
            >
              Commit
            </Button>
            <Button
              onClick={handleGenerateCommit}
              size="sm"
              variant="secondary"
              isLoading={isGenerating}
              disabled={stagedCount === 0}
            >
              Gerar
            </Button>
          </div>
        </div>
      }
      contentClassName="p-4"
    >
      <div>
        <Textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          rows={5}
        />
      </div>
    </Panel>
  );
};
