import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Diff, Hunk, isDelete, isInsert, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabMerge } from '@/hooks/useTabMerge';

interface DiffViewerProps {
  className?: string;
}

type ParsedFile = ReturnType<typeof parseDiff>[number];

type DiffItem = {
  id: string;
  staged: boolean;
  file: ParsedFile;
  filePath: string;
  label: string;
  added: number;
  deleted: number;
};

const normalizePath = (path?: string | null) => {
  if (!path) return '';
  return path.replace(/^a\//, '').replace(/^b\//, '');
};

const getAddedDeletedCounts = (file: ParsedFile) => {
  let added = 0;
  let deleted = 0;
  for (const hunk of file.hunks ?? []) {
    for (const change of hunk.changes ?? []) {
      if (isInsert(change)) added += 1;
      if (isDelete(change)) deleted += 1;
    }
  }
  return { added, deleted };
};

const getFileLabel = (file: ParsedFile) => {
  const oldPath = normalizePath(file.oldPath);
  const newPath = normalizePath(file.newPath);

  if (oldPath && newPath && oldPath !== newPath && oldPath !== '/dev/null') {
    return `${oldPath} → ${newPath}`;
  }

  if (newPath && newPath !== '/dev/null') return newPath;
  if (oldPath && oldPath !== '/dev/null') return oldPath;
  return 'Unknown file';
};

export const DiffViewer: React.FC<DiffViewerProps> = ({ className = '' }) => {
  const { selectedFile, status, getAllDiff } = useTabGit();
  const { isMergeInProgress } = useTabMerge();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [diffText, setDiffText] = useState<{ staged: string; unstaged: string }>({
    staged: '',
    unstaged: '',
  });

  const diffKey = useMemo(() => {
    if (!status) return '';
    return status.files
      .map((file) => `${file.path}:${file.status}:${file.staged ? '1' : '0'}`)
      .sort()
      .join('|');
  }, [status]);

  useEffect(() => {
    let active = true;

    const loadAllDiffs = async () => {
      if (!status) {
        setDiffText({ staged: '', unstaged: '' });
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [stagedDiff, unstagedDiff] = await Promise.all([getAllDiff(true), getAllDiff(false)]);
        if (!active) return;
        setDiffText({
          staged: stagedDiff ?? '',
          unstaged: unstagedDiff ?? '',
        });
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setIsLoading(false);
      }
    };

    loadAllDiffs();

    return () => {
      active = false;
    };
  }, [diffKey]);

  const { items, parseError } = useMemo(() => {
    const result: DiffItem[] = [];
    let parsingError: string | null = null;

    const addItems = (text: string, staged: boolean) => {
      if (!text || !text.trim()) return;
      const files = parseDiff(text);
      for (const file of files) {
        const newPath = normalizePath(file.newPath);
        const oldPath = normalizePath(file.oldPath);
        const filePath =
          (newPath && newPath !== '/dev/null' ? newPath : '') || (oldPath && oldPath !== '/dev/null' ? oldPath : '');
        const label = getFileLabel(file);
        const { added, deleted } = getAddedDeletedCounts(file);
        result.push({
          id: `${staged ? 'staged' : 'unstaged'}:${filePath}`,
          staged,
          file,
          filePath,
          label,
          added,
          deleted,
        });
      }
    };

    try {
      addItems(diffText.staged, true);
      addItems(diffText.unstaged, false);
    } catch (err) {
      parsingError = err instanceof Error ? err.message : String(err);
    }

    return { items: result, parseError: parsingError };
  }, [diffText.staged, diffText.unstaged]);

  const cardRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  useEffect(() => {
    if (!selectedFile) return;
    const stagedPreferred = status?.files.find((file) => file.path === selectedFile)?.staged ?? false;
    const preferredId = `${stagedPreferred ? 'staged' : 'unstaged'}:${selectedFile}`;
    const fallbackId = `${stagedPreferred ? 'unstaged' : 'staged'}:${selectedFile}`;

    const el = cardRefs.current.get(preferredId) ?? cardRefs.current.get(fallbackId);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, [selectedFile, status, items]);

  const renderContent = () => {
    if (!status) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          Open a repository to view diffs.
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          Loading diff...
        </div>
      );
    }

    if (error || parseError) {
      const errorMsg = isMergeInProgress
        ? 'Merge em andamento: Resolva os conflitos para visualizar o diff.'
        : error
          ? `Failed to load diff: ${error}`
          : `Failed to parse diff: ${parseError}`;
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-sm">
          <span className={isMergeInProgress ? 'text-warning' : 'text-danger'}>{errorMsg}</span>
          {isMergeInProgress && (
            <span className="text-xs text-text3">
              Acesse a página de Conflitos para resolver o merge.
            </span>
          )}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          No diff to display.
        </div>
      );
    }

    return (
      <div className="space-y-4 p-4">
        {items.map((item) => {
          const statusEntry = status.files.find((file) => file.path === item.filePath);
          const fileStatus = statusEntry?.status ?? 'Unknown';

          const statusBadge = (() => {
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
                return <Badge>{fileStatus[0] ?? '?'}</Badge>;
            }
          })();

          const isSelected = selectedFile === item.filePath;

          return (
            <div
              key={item.id}
              ref={(el) => {
                cardRefs.current.set(item.id, el);
              }}
              tabIndex={-1}
              className="scroll-mt-4 focus:outline-none"
            >
              <Panel
                title={item.label}
                collapsible
                collapseKey={`diff.${encodeURIComponent(item.id)}`}
                className={`shadow-none ${isSelected ? 'border-primary/50 ring-1 ring-primary/20' : 'bg-surface1'}`}
                actions={
                  <div className="flex items-center gap-2 text-xs text-text3">
                    {statusBadge}
                    <Badge variant={item.staged ? 'success' : 'warning'}>
                      {item.staged ? 'Staged' : 'Unstaged'}
                    </Badge>
                    <span className="font-mono">
                      +{item.added} -{item.deleted}
                    </span>
                  </div>
                }
                contentClassName="diff-viewer"
              >
                <div className="bg-[rgb(8,8,12)] p-4">
                  {item.file.isBinary ? (
                    <div className="text-sm text-text-secondary">Binary file diff not supported.</div>
                  ) : (
                    <Diff viewType="unified" diffType={item.file.type} hunks={item.file.hunks}>
                      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
                    </Diff>
                  )}
                </div>
              </Panel>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Panel title="Diff" className={className} collapsible collapseKey="diff">
      {renderContent()}
    </Panel>
  );
};
