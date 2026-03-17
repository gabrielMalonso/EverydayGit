import React, { useEffect, useMemo, useState, useDeferredValue, startTransition } from 'react';
import { useTranslation } from 'react-i18next';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { normalizePath, getAddedDeletedCounts, getFileLabel } from '@/lib/diffUtils';
import { formatDate } from '@/lib/formatDate';
import type { PrReviewComment } from '@/types';

interface PrDiffViewerProps {
  prDiff: string | null;
  isLoading: boolean;
  reviewComments: PrReviewComment[];
  className?: string;
}

type ParsedFile = ReturnType<typeof parseDiff>[number];

type DiffItem = {
  id: string;
  file: ParsedFile;
  filePath: string;
  label: string;
  added: number;
  deleted: number;
};

export const PrDiffViewer: React.FC<PrDiffViewerProps> = ({ prDiff, isLoading, reviewComments, className = '' }) => {
  const { t } = useTranslation('pullRequests');

  const deferredDiff = useDeferredValue(prDiff);
  const [items, setItems] = useState<DiffItem[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  // Parse diff with startTransition for large diffs
  useEffect(() => {
    startTransition(() => {
      if (!deferredDiff || !deferredDiff.trim()) {
        setItems([]);
        setParseError(null);
        return;
      }

      try {
        const files = parseDiff(deferredDiff);
        const result: DiffItem[] = files.map((file) => {
          const newPath = normalizePath(file.newPath);
          const oldPath = normalizePath(file.oldPath);
          const filePath =
            (newPath && newPath !== '/dev/null' ? newPath : '') ||
            (oldPath && oldPath !== '/dev/null' ? oldPath : '');
          const label = getFileLabel(file);
          const { added, deleted } = getAddedDeletedCounts(file);
          return {
            id: filePath || label,
            file,
            filePath,
            label,
            added,
            deleted,
          };
        });
        setItems(result);
        setParseError(null);
      } catch (err) {
        setParseError(err instanceof Error ? err.message : String(err));
      }
    });
  }, [deferredDiff]);

  // Group review comments by file path for quick lookup
  const commentsByFile = useMemo(() => {
    const map = new Map<string, PrReviewComment[]>();
    for (const comment of reviewComments) {
      const existing = map.get(comment.path) ?? [];
      existing.push(comment);
      map.set(comment.path, existing);
    }
    return map;
  }, [reviewComments]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          <div className="flex flex-col items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            <span>{t('diff.loading')}</span>
          </div>
        </div>
      );
    }

    if (prDiff === null) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          {t('diff.empty')}
        </div>
      );
    }

    if (parseError) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-danger">
          {parseError}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          {t('diff.noChanges')}
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-4">
        {items.map((item) => {
          const fileComments = commentsByFile.get(item.filePath) ?? [];

          return (
            <div key={item.id} className="scroll-mt-4">
              <div className="flex flex-col rounded-card border border-border1 bg-surface1 transition-all duration-200 ease-out">
                {/* File header */}
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border1 bg-surface1 px-5 py-1 rounded-t-card">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-text1">
                      <span className="block truncate">{item.label}</span>
                    </h3>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-text3">
                    <span className="font-mono">
                      <span className="text-success">+{item.added}</span>{' '}
                      <span className="text-danger">-{item.deleted}</span>
                    </span>
                  </div>
                </div>

                {/* Diff content */}
                <div className="flex-1 min-h-0 min-w-0 diff-viewer">
                  <div className="bg-[rgb(8,8,12)] p-4 rounded-b-card">
                    {item.file.isBinary ? (
                      <div className="text-sm text-text-secondary">Binary file</div>
                    ) : (
                      <Diff viewType="unified" diffType={item.file.type} hunks={item.file.hunks}>
                        {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
                      </Diff>
                    )}
                  </div>
                </div>

                {/* Inline review comments for this file */}
                {fileComments.length > 0 && (
                  <div className="border-t border-border1 bg-surface2/20 p-3">
                    <div className="flex flex-col gap-2">
                      {fileComments.map((rc, idx) => (
                        <div
                          key={`rc-${idx}`}
                          className="rounded-card-inner border border-accent/20 bg-accent/5 p-3"
                        >
                          <div className="mb-1 flex items-center gap-2 text-xs text-text3">
                            <span className="font-semibold text-accent">{rc.author_login}</span>
                            {rc.line !== null && (
                              <>
                                <span aria-hidden>·</span>
                                <span className="font-mono">L{rc.line}</span>
                              </>
                            )}
                            <span className="ml-auto">{formatDate(rc.created_at)}</span>
                          </div>
                          <p className="whitespace-pre-wrap break-words text-sm text-text1">{rc.body}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col overflow-hidden ${className}`}>
      <div className="flex-1 min-h-0 overflow-auto scroll-smooth">
        {renderContent()}
      </div>
    </div>
  );
};
