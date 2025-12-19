import React, { useEffect } from 'react';
import { Panel } from './Panel';
import { Button } from '../ui';
import { ListItem } from './ListItem';
import { Badge } from './Badge';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useGit } from '../hooks/useGit';

interface ChangesListPanelProps {
  className?: string;
}

export const ChangesListPanel: React.FC<ChangesListPanelProps> = ({ className = '' }) => {
  const { status, selectedFile, setSelectedFile } = useGitStore();
  const { repoPath } = useRepoStore();
  const { refreshStatus, stageFile, unstageFile, stageAll, push, pull } = useGit();

  useEffect(() => {
    if (!repoPath) return;

    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => window.clearInterval(interval);
  }, [repoPath]);

  const stagedFiles = status?.files.filter((file) => file.staged) || [];
  const unstagedFiles = status?.files.filter((file) => !file.staged) || [];

  const handleStage = async (filePath: string) => {
    try {
      await stageFile(filePath);
    } catch (error) {
      alert(`Failed to stage file: ${error}`);
    }
  };

  const handleStageAll = async () => {
    try {
      await stageAll();
    } catch (error) {
      alert(`Failed to stage all files: ${error}`);
    }
  };

  const handleUnstage = async (filePath: string) => {
    try {
      await unstageFile(filePath);
    } catch (error) {
      alert(`Failed to unstage file: ${error}`);
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

  const getStatusBadge = (fileStatus: string) => {
    switch (fileStatus) {
      case 'Modified':
        return <Badge variant="warning">M</Badge>;
      case 'Added':
        return <Badge variant="success">A</Badge>;
      case 'Deleted':
        return <Badge variant="danger">D</Badge>;
      case 'Untracked':
        return <Badge>?</Badge>;
      default:
        return <Badge>{fileStatus[0]}</Badge>;
    }
  };

  return (
    <Panel
      title="Changes"
      className={className}
      collapsible
      collapseKey="changes-list"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={handlePull} variant="secondary" size="sm">
            Pull
          </Button>
          <Button onClick={handlePush} variant="secondary" size="sm" disabled={!status || status.ahead === 0}>
            Push
          </Button>
          <Button onClick={handleStageAll} variant="secondary" size="sm" disabled={unstagedFiles.length === 0}>
            Stage All
          </Button>
        </div>
      }
    >
      <div className="flex flex-col px-1 py-2">
        <div className="px-4 py-2 text-xs font-semibold uppercase text-text3">
          Staged Changes ({stagedFiles.length})
        </div>
        {stagedFiles.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text3">No staged changes</div>
        ) : (
          stagedFiles.map((file) => (
            <ListItem key={file.path} active={selectedFile === file.path} onClick={() => setSelectedFile(file.path)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {getStatusBadge(file.status)}
                  <span className="truncate text-sm">{file.path}</span>
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

        <div className="mt-4 px-4 py-2 text-xs font-semibold uppercase text-text3">
          Unstaged Changes ({unstagedFiles.length})
        </div>
        {unstagedFiles.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text3">No unstaged changes</div>
        ) : (
          unstagedFiles.map((file) => (
            <ListItem key={file.path} active={selectedFile === file.path} onClick={() => setSelectedFile(file.path)}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  {getStatusBadge(file.status)}
                  <span className="truncate text-sm">{file.path}</span>
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
    </Panel>
  );
};

