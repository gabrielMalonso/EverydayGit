import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Panel } from './Panel';
import { Button } from '../ui';
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
          <Button onClick={handlePull} variant="secondary" size="sm" className="w-9 !px-0" aria-label="Pull" title="Pull">
            <ArrowDown className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            onClick={handlePush}
            variant="secondary"
            size="sm"
            className="w-9 !px-0"
            disabled={stagedFiles.length === 0 && commitMessage === ''}
            aria-label="Push"
            title="Push"
          >
            <ArrowUp className="h-4 w-4" aria-hidden />
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
