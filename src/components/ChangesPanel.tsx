import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Panel } from './Panel';
import { Button, Spinner } from '../ui';
import { Textarea } from './Textarea';
import { ListItem } from './ListItem';
import { Badge } from './Badge';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useAiStore } from '../stores/aiStore';
import { useGit } from '../hooks/useGit';

export const ChangesPanel: React.FC = () => {
  const { status, selectedFile, setSelectedFile } = useGitStore();
  const { repoPath } = useRepoStore();
  const { commitSuggestion } = useAiStore();
  const { refreshStatus, stageFile, unstageFile, commit, push, pull } = useGit();
  const [commitMessage, setCommitMessage] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    if (repoPath) {
      refreshStatus();
      const interval = setInterval(refreshStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [repoPath]);

  useEffect(() => {
    if (commitSuggestion) {
      setCommitMessage(commitSuggestion);
    }
  }, [commitSuggestion]);

  const stagedFiles = status?.files.filter(f => f.staged) || [];
  const unstagedFiles = status?.files.filter(f => !f.staged) || [];

  const handleStage = async (filePath: string) => {
    try {
      await stageFile(filePath);
    } catch {
      // Toast exibe erro se necessário
    }
  };

  const handleUnstage = async (filePath: string) => {
    try {
      await unstageFile(filePath);
    } catch {
      // Toast exibe erro se necessário
    }
  };

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
    if (isPushing || isPulling) return;
    try {
      setIsPushing(true);
      await push();
    } catch {
      // Toast já exibe o erro
    } finally {
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (isPushing || isPulling) return;
    try {
      setIsPulling(true);
      await pull();
    } catch {
      // Toast já exibe o erro
    } finally {
      setIsPulling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Modified':
        return <Badge variant="warning">M</Badge>;
      case 'Added':
        return <Badge variant="success">A</Badge>;
      case 'Deleted':
        return <Badge variant="danger">D</Badge>;
      case 'Untracked':
        return <Badge>?</Badge>;
      default:
        return <Badge>{status[0]}</Badge>;
    }
  };

  return (
    <Panel
      title="Changes"
      className="h-full"
      actions={
        <div className="flex gap-2">
          <Button
            onClick={handlePull}
            variant="secondary"
            size="sm"
            className="!px-2.5"
            disabled={isPushing || isPulling}
            aria-label={status?.behind ? `Pull (${status.behind} pending)` : 'Pull'}
            title={status?.behind ? `Pull (${status.behind})` : 'Pull'}
          >
            {isPulling ? <Spinner className="h-4 w-4" label="Pulling" /> : <ArrowDown className="h-4 w-4" aria-hidden />}
            {status?.behind ? <span className="text-xs font-semibold tabular-nums">[{status.behind}]</span> : null}
          </Button>
          <Button
            onClick={handlePush}
            variant="secondary"
            size="sm"
            className="!px-2.5"
            disabled={(stagedFiles.length === 0 && commitMessage === '') || isPushing || isPulling}
            aria-label={status?.ahead ? `Push (${status.ahead} pending)` : 'Push'}
            title={status?.ahead ? `Push (${status.ahead})` : 'Push'}
          >
            {isPushing ? <Spinner className="h-4 w-4" label="Pushing" /> : <ArrowUp className="h-4 w-4" aria-hidden />}
            {status?.ahead ? <span className="text-xs font-semibold tabular-nums">[{status.ahead}]</span> : null}
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto px-1 py-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase text-text3">
            Staged Changes ({stagedFiles.length})
          </div>
          {stagedFiles.length === 0 ? (
            <div className="px-4 py-2 text-sm text-text3">No staged changes</div>
          ) : (
            stagedFiles.map((file) => (
              <ListItem
                key={file.path}
                active={selectedFile === file.path}
                onClick={() => setSelectedFile(file.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(file.status)}
                    <span className="text-sm truncate">{file.path}</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstage(file.path);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 !px-0"
                    aria-label={`Unstage ${file.path}`}
                  >
                    −
                  </Button>
                </div>
              </ListItem>
            ))
          )}

          <div className="px-4 py-2 mt-4 text-xs font-semibold uppercase text-text3">
            Unstaged Changes ({unstagedFiles.length})
          </div>
          {unstagedFiles.length === 0 ? (
            <div className="px-4 py-2 text-sm text-text3">No unstaged changes</div>
          ) : (
            unstagedFiles.map((file) => (
              <ListItem
                key={file.path}
                active={selectedFile === file.path}
                onClick={() => setSelectedFile(file.path)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(file.status)}
                    <span className="text-sm truncate">{file.path}</span>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStage(file.path);
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 !px-0"
                    aria-label={`Stage ${file.path}`}
                  >
                    +
                  </Button>
                </div>
              </ListItem>
            ))
          )}
        </div>

        <div className="border-t border-border1 bg-surface2/40 p-3">
          <Textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            rows={2}
            className="mb-2"
          />
          <Button
            onClick={handleCommit}
            disabled={stagedFiles.length === 0 || !commitMessage.trim()}
            className="w-full"
          >
            Commit
          </Button>
        </div>
      </div>
    </Panel>
  );
};
