import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
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
  const { commit, getAllDiff, pull, push, stageAll } = useGit();
  const { generateCommitMessage } = useAi();

  const [commitMessage, setCommitMessage] = useState('');

  useEffect(() => {
    if (commitSuggestion) setCommitMessage(commitSuggestion);
  }, [commitSuggestion]);

  const stagedCount = useMemo(() => status?.files.filter((file) => file.staged).length ?? 0, [status]);
  const unstagedCount = useMemo(() => status?.files.filter((file) => !file.staged).length ?? 0, [status]);

  const handleCommit = async () => {
    if (!commitMessage.trim()) return;

    try {
      await commit(commitMessage);
      setCommitMessage('');
    } catch {
      // Toast já exibe o erro
    }
  };

  const handlePush = async () => {
    try {
      await push();
    } catch {
      // Toast já exibe o erro
    }
  };

  const handlePull = async () => {
    try {
      await pull();
    } catch {
      // Toast já exibe o erro
    }
  };

  const handleStageAll = async () => {
    try {
      await stageAll();
    } catch {
      // Toast exibe erro se necessário
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
              onClick={handlePush}
              variant="secondary"
              size="sm"
              className="!px-2.5"
              disabled={!status || status.ahead === 0}
              aria-label={status?.ahead ? `Push (${status.ahead} pending)` : 'Push'}
              title={status?.ahead ? `Push (${status.ahead})` : 'Push'}
            >
              <ArrowUp className="h-4 w-4" aria-hidden />
              {status?.ahead ? <span className="text-xs font-semibold tabular-nums">[{status.ahead}]</span> : null}
            </Button>
            <Button
              onClick={handlePull}
              variant="secondary"
              size="sm"
              className="!px-2.5"
              aria-label={status?.behind ? `Pull (${status.behind} pending)` : 'Pull'}
              title={status?.behind ? `Pull (${status.behind})` : 'Pull'}
            >
              <ArrowDown className="h-4 w-4" aria-hidden />
              {status?.behind ? <span className="text-xs font-semibold tabular-nums">[{status.behind}]</span> : null}
            </Button>
            <Button
              onClick={handleStageAll}
              variant="secondary"
              size="sm"
              className="w-9 !px-0"
              disabled={unstagedCount === 0}
              aria-label="Stage all"
              title="Stage all"
            >
              <Plus className="h-4 w-4" aria-hidden />
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
            <Button
              onClick={handleCommit}
              size="sm"
              disabled={stagedCount === 0 || !commitMessage.trim() || isGenerating}
            >
              Commit
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
