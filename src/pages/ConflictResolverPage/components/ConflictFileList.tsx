import React from 'react';
import { Panel } from '@/components/Panel';
import { Button } from '@/ui';
import { Check, FileWarning } from 'lucide-react';

interface Props {
  files: string[];
  selectedFile: string | null;
  resolvedFiles: Set<string>;
  isLoading: boolean;
  isCompleting?: boolean;
  onSelectFile: (path: string) => void;
  onCompleteMerge: () => void;
  canComplete: boolean;
}

export const ConflictFileList: React.FC<Props> = ({
  files,
  selectedFile,
  resolvedFiles,
  isLoading,
  isCompleting = false,
  onSelectFile,
  onCompleteMerge,
  canComplete,
}) => {
  const resolvedCount = files.filter((file) => resolvedFiles.has(file)).length;
  const total = files.length;
  const progress = total > 0 ? Math.round((resolvedCount / total) * 100) : 0;

  return (
    <Panel
      title="Arquivos em Conflito"
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={onCompleteMerge}
          disabled={!canComplete}
          isLoading={isCompleting}
        >
          Finalizar merge
        </Button>
      }
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-border1 px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-text3">
            <span>
              {resolvedCount}/{total} resolvidos
            </span>
            <span>{progress}%</span>
          </div>
          <div
            className="mt-2 h-2 w-full rounded-full bg-surface2"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={resolvedCount}
          >
            <div
              className="h-full rounded-full bg-success transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-text3">Carregando conflitos...</div>
          ) : files.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text3">Nenhum conflito pendente.</div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
              {files.map((file) => {
                const isResolved = resolvedFiles.has(file);
                const isSelected = file === selectedFile;

                return (
                  <button
                    key={file}
                    type="button"
                    onClick={() => onSelectFile(file)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-button border px-3 py-1.5 text-xs font-medium transition-colors ${
                      isSelected ? 'border-primary/40 bg-surface3' : 'border-border1 bg-surface2 hover:bg-surface3'
                    } ${isResolved ? 'text-successFg' : 'text-text1'}`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        isResolved ? 'bg-successBg text-successFg' : 'bg-warningBg text-warningFg'
                      }`}
                      aria-hidden
                    >
                      {isResolved ? <Check size={12} /> : <FileWarning size={12} />}
                    </span>
                    <span className="max-w-[18rem] truncate">{file}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};
