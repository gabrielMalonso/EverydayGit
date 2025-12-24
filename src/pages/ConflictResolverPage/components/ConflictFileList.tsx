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

  return (
    <Panel
      title="Arquivos em Conflito"
      className="col-span-1"
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
        <div className="border-b border-border1 px-4 py-2 text-xs text-text3">
          {resolvedCount}/{total} resolvidos
        </div>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-text3">Carregando conflitos...</div>
          ) : files.length === 0 ? (
            <div className="px-4 py-3 text-sm text-text3">Nenhum conflito pendente.</div>
          ) : (
            files.map((file) => {
              const isResolved = resolvedFiles.has(file);
              const isSelected = file === selectedFile;

              return (
                <button
                  key={file}
                  type="button"
                  onClick={() => onSelectFile(file)}
                  className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-surface3' : 'hover:bg-surface2'
                  } ${isResolved ? 'text-success' : 'text-text1'}`}
                >
                  {isResolved ? (
                    <Check size={14} className="text-success" />
                  ) : (
                    <FileWarning size={14} className="text-warning" />
                  )}
                  <span className="truncate">{file}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
};
