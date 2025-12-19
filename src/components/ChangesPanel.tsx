import React, { useEffect, useState } from 'react';
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
    } catch (error) {
      alert(`Failed to stage file: ${error}`);
    }
  };

  const handleUnstage = async (filePath: string) => {
    try {
      await unstageFile(filePath);
    } catch (error) {
      alert(`Failed to unstage file: ${error}`);
    }
  };

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

  const handlePush = async () => {
    try {
      await push();
      alert('Pushed successfully!');
    } catch (error) {
      alert(`Failed to push: ${error}`);
    }
  };

  const handlePull = async () => {
    try {
      await pull();
      alert('Pulled successfully!');
    } catch (error) {
      alert(`Failed to pull: ${error}`);
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
          <Button onClick={handlePull} variant="secondary" size="sm">
            Pull
          </Button>
          <Button
            onClick={handlePush}
            variant="secondary"
            size="sm"
            disabled={stagedFiles.length === 0 && commitMessage === ''}
          >
            Push
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
                  >
                    +
                  </Button>
                </div>
              </ListItem>
            ))
          )}
        </div>

        <div className="border-t border-border1 bg-surface2/40 p-4">
          <Textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Commit message..."
            rows={3}
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
