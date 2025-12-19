import React, { useEffect, useMemo, useState } from 'react';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import { Panel } from './Panel';
import { useGitStore } from '../stores/gitStore';
import { useGit } from '../hooks/useGit';

export const DiffViewer: React.FC = () => {
  const { selectedFile, selectedDiff, status, setSelectedDiff } = useGitStore();
  const { getFileDiff } = useGit();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const staged = useMemo(() => {
    if (!selectedFile || !status) return false;
    const file = status.files.find((item) => item.path === selectedFile);
    return file?.staged ?? false;
  }, [selectedFile, status]);

  useEffect(() => {
    let active = true;

    const loadDiff = async () => {
      if (!selectedFile) {
        setSelectedDiff(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        await getFileDiff(selectedFile, staged);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    loadDiff();

    return () => {
      active = false;
    };
  }, [selectedFile, staged, setSelectedDiff]);

  let parsedFiles: ReturnType<typeof parseDiff> = [];
  let parseError: string | null = null;

  if (selectedDiff && selectedDiff.trim()) {
    try {
      parsedFiles = parseDiff(selectedDiff);
    } catch (err) {
      parseError = err instanceof Error ? err.message : String(err);
    }
  }

  const renderContent = () => {
    if (!selectedFile) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          Select a file to view its diff.
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

    if (error) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-danger">
          Failed to load diff: {error}
        </div>
      );
    }

    if (parseError) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-danger">
          Failed to parse diff: {parseError}
        </div>
      );
    }

    if (!selectedDiff || !selectedDiff.trim() || parsedFiles.length === 0) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-text-secondary">
          No diff to display.
        </div>
      );
    }

    return (
      <div className="diff-viewer p-4 space-y-6">
        {parsedFiles.map((file) => {
          const fileLabel =
            file.oldPath && file.newPath && file.oldPath !== file.newPath
              ? `${file.oldPath} -> ${file.newPath}`
              : file.newPath || file.oldPath;

          if (file.isBinary) {
            return (
              <div key={`${file.oldPath}-${file.newPath}`}>
                <div className="text-xs text-text-secondary mb-2">{fileLabel}</div>
                <div className="text-sm text-text-secondary">
                  Binary file diff not supported.
                </div>
              </div>
            );
          }

          return (
            <div key={`${file.oldPath}-${file.newPath}`}>
              <div className="text-xs text-text-secondary mb-2">{fileLabel}</div>
              <Diff viewType="unified" diffType={file.type} hunks={file.hunks}>
                {(hunks) =>
                  hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)
                }
              </Diff>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Panel
      title="Diff"
      className="h-full"
      actions={
        selectedFile ? (
          <span className="text-xs text-text-secondary">
            {staged ? 'Staged' : 'Unstaged'}
          </span>
        ) : null
      }
    >
      {renderContent()}
    </Panel>
  );
};
