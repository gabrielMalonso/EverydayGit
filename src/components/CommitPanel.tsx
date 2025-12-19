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
    if (!commitMessage.trim()) {
      alert('Please enter a commit message');
      return;
    }

    try {
      await commit(commitMessage);
      setCommitMessage('');
      alert('Committed successfully!');
    } catch (error) {
      alert(`Failed to commit: ${error}`);
    }
  };

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

  return (
    <Panel
      title="Commit"
      className={className}
      collapsible
      collapseKey="commit"
      actions={
        <div className="text-xs text-text3">
          {stagedCount > 0 ? `${stagedCount} staged` : 'No staged changes'}
        </div>
      }
      contentClassName="p-4"
    >
      <div className="space-y-3">
        <Textarea
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder="Commit message..."
          rows={3}
        />

        <div className="flex gap-2">
          <Button
            onClick={handleCommit}
            disabled={stagedCount === 0 || !commitMessage.trim() || isGenerating}
            className="flex-1"
          >
            Commit
          </Button>
          <Button
            onClick={handleGenerateCommit}
            variant="secondary"
            isLoading={isGenerating}
            disabled={stagedCount === 0}
          >
            Gerar
          </Button>
        </div>
      </div>
    </Panel>
  );
};

