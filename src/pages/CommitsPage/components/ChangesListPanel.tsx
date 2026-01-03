import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Panel } from '@/components/Panel';
import { Button, ToggleSwitch } from '@/ui';
import { ListItem } from '@/components/ListItem';
import { Badge } from '@/components/Badge';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabMerge } from '@/hooks/useTabMerge';
import { useTabRepo } from '@/hooks/useTabRepo';

interface ChangesListPanelProps {
  className?: string;
}

export const ChangesListPanel: React.FC<ChangesListPanelProps> = React.memo(({ className = '' }) => {
  const { status, selectedFile, selectFile, refreshStatus, stageFile, unstageFile, stageAll } = useTabGit();
  const { isMergeInProgress } = useTabMerge();
  const { repoPath } = useTabRepo();
  const AUTO_STAGE_STORAGE_KEY = 'everydaygit.changes.autoStage';
  const LEGACY_AUTO_STAGE_STORAGE_KEY = 'gitflow-ai.changes.autoStage';
  const [autoStageEnabled, setAutoStageEnabled] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = window.localStorage.getItem(AUTO_STAGE_STORAGE_KEY);
      if (raw !== null) return raw === '1';

      const legacyRaw = window.localStorage.getItem(LEGACY_AUTO_STAGE_STORAGE_KEY);
      if (legacyRaw !== null) {
        window.localStorage.setItem(AUTO_STAGE_STORAGE_KEY, legacyRaw);
        return legacyRaw === '1';
      }

      return false;
    } catch {
      return false;
    }
  });
  const [isAutoStaging, setIsAutoStaging] = useState(false);
  const autoStageInFlightRef = useRef(false);

  useEffect(() => {
    if (!repoPath) return;

    // refreshStatus() removido - TabContent.refreshAll() já faz a carga inicial
    // Mantém apenas o polling para detectar mudanças externas
    const interval = window.setInterval(refreshStatus, 5000);
    return () => window.clearInterval(interval);
  }, [repoPath, refreshStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(AUTO_STAGE_STORAGE_KEY, autoStageEnabled ? '1' : '0');
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
    if (isMergeInProgress) return;

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
  }, [autoStageEnabled, repoPath, stageAll, unstagedFiles.length, isMergeInProgress]);

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
    >
      <div className="flex h-full min-h-0 flex-col py-2">
        {isMergeInProgress && (
          <div className="mx-4 mb-2 rounded-card-inner border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            <span className="font-medium">Merge em andamento:</span> Stage bloqueado.
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-auto px-1 pb-2">
          <div className="px-4 py-2 text-xs font-semibold uppercase text-text3">
            Staged Changes ({stagedFiles.length})
          </div>
          {stagedFiles.length === 0 ? (
            <div className="px-4 py-2 text-sm text-text3">No staged changes</div>
          ) : (
            stagedFiles.map((file) => (
              <ListItem key={file.path} active={selectedFile === file.path} onClick={() => selectFile(file.path)}>
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
              <ListItem key={file.path} active={selectedFile === file.path} onClick={() => selectFile(file.path)}>
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
                    disabled={isMergeInProgress}
                    title={isMergeInProgress ? 'Stage bloqueado durante merge' : undefined}
                  >
                    +
                  </Button>
                </div>
              </ListItem>
            ))
          )}
        </div>

        <div className="shrink-0 px-1">
          <div className="flex items-center justify-between gap-3 border-t border-border1 bg-surface2/40 px-4 py-3">
            <div className="flex min-w-0 flex-col">
              <span className="text-xs font-semibold uppercase text-text3">Auto-stage</span>
              <span className="text-xs text-text3">Stage all changes automatically</span>
            </div>
            <ToggleSwitch
              checked={autoStageEnabled}
              onToggle={() => setAutoStageEnabled((prev) => !prev)}
              label="Auto-stage"
              disabled={!repoPath || isMergeInProgress}
              loading={isAutoStaging}
            />
          </div>
        </div>
      </div>
    </Panel>
  );
});

ChangesListPanel.displayName = 'ChangesListPanel';
