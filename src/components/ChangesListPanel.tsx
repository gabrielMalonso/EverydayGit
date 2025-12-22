import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus } from 'lucide-react';
import { Panel } from './Panel';
import { Button, ToggleSwitch } from '../ui';
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
  const [autoStageEnabled, setAutoStageEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem('gitflow-ai.changes.autoStage') === '1';
    } catch {
      return false;
    }
  });
  const [isAutoStaging, setIsAutoStaging] = useState(false);
  const autoStageInFlightRef = useRef(false);

  useEffect(() => {
    if (!repoPath) return;

    refreshStatus();
    const interval = window.setInterval(refreshStatus, 5000);
    return () => window.clearInterval(interval);
  }, [repoPath]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('gitflow-ai.changes.autoStage', autoStageEnabled ? '1' : '0');
    } catch {
      // ignore storage failures
    }
  }, [autoStageEnabled]);

  const stagedFiles = useMemo(() => status?.files.filter((file) => file.staged) || [], [status]);
  const unstagedFiles = useMemo(() => status?.files.filter((file) => !file.staged) || [], [status]);

  useEffect(() => {
    if (!autoStageEnabled) return;
    if (!repoPath) return;
    if (!unstagedFiles.length) return;
    if (autoStageInFlightRef.current) return;

    autoStageInFlightRef.current = true;
    setIsAutoStaging(true);
    stageAll()
      .catch((error) => {
        console.error('Auto-stage failed:', error);
      })
      .finally(() => {
        autoStageInFlightRef.current = false;
        setIsAutoStaging(false);
      });
  }, [autoStageEnabled, repoPath, stageAll, unstagedFiles.length]);

  const handleStage = async (filePath: string) => {
    try {
      await stageFile(filePath);
    } catch {
      // Toast exibe erro se necessário
    }
  };

  const handleStageAll = async () => {
    try {
      await stageAll();
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
            onClick={handleStageAll}
            variant="secondary"
            size="sm"
            className="w-9 !px-0"
            disabled={unstagedFiles.length === 0 || isAutoStaging}
            aria-label="Stage all"
            title="Stage all"
          >
            <Plus className="h-4 w-4" aria-hidden />
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

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border1 bg-surface2/40 px-4 py-3">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-semibold uppercase text-text3">Auto-stage</span>
            <span className="text-xs text-text3">Stage all changes automatically</span>
          </div>
          <ToggleSwitch
            checked={autoStageEnabled}
            onToggle={() => setAutoStageEnabled((prev) => !prev)}
            label="Auto-stage"
            disabled={!repoPath}
            loading={isAutoStaging}
          />
        </div>
      </div>
    </Panel>
  );
};
