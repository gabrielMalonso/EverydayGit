import React from 'react';
import { Panel } from '@/components/Panel';
import { Button } from '@/ui';
import { Save } from 'lucide-react';

interface Props {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  canSave: boolean;
  isReadyToSave?: boolean;
  disabled?: boolean;
  isSaving?: boolean;
  contextBefore: string[];
  contextAfter: string[];
  startLine: number;
}

export const ResolutionPreview: React.FC<Props> = ({
  content,
  onChange,
  onSave,
  canSave,
  isReadyToSave = false,
  disabled = false,
  isSaving = false,
  contextBefore,
  contextAfter,
  startLine,
}) => {
  const [isEditing, setIsEditing] = React.useState(false);
  const resolvedLines = content.split('\n');
  const resolvedLineCount = Math.max(resolvedLines.length, 1);
  const contextStartLine = Math.max(1, startLine - contextBefore.length);
  const contextAfterStartLine = startLine + resolvedLineCount;
  const lineNumbers = Array.from({ length: resolvedLineCount }, (_, index) => startLine + index);
  const previewLines = [
    ...contextBefore.map((line, index) => ({
      id: `before-${contextStartLine + index}`,
      lineNumber: contextStartLine + index,
      value: line,
      kind: 'context' as const,
    })),
    ...resolvedLines.map((line, index) => ({
      id: `resolved-${startLine + index}`,
      lineNumber: startLine + index,
      value: line,
      kind: 'resolved' as const,
    })),
    ...contextAfter.map((line, index) => ({
      id: `after-${contextAfterStartLine + index}`,
      lineNumber: contextAfterStartLine + index,
      value: line,
      kind: 'context' as const,
    })),
  ];

  return (
    <Panel
      title="Resultado"
      actions={
        <div className="flex items-center gap-3">
          {isReadyToSave && <span className="text-xs text-success">Pronto para salvar</span>}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsEditing((prev) => !prev)} disabled={disabled}>
              {isEditing ? 'Ver preview' : 'Editar'}
            </Button>
            <Button size="sm" variant="primary" onClick={onSave} disabled={!canSave || disabled} isLoading={isSaving}>
              <Save size={14} />
              Salvar arquivo
            </Button>
          </div>
        </div>
      }
    >
      <div className="p-4">
        <div className="diff-viewer max-h-[480px] min-h-[320px] overflow-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-3 font-mono text-sm">
          {isEditing ? (
            <>
              {contextBefore.map((line, index) => {
                const lineNumber = contextStartLine + index;
                return (
                  <div key={`before-${lineNumber}-${index}`} className="flex gap-3 leading-relaxed">
                    <span className="w-4 shrink-0 text-text3"> </span>
                    <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
                    <span className="whitespace-pre text-text3">{line === '' ? ' ' : line}</span>
                  </div>
                );
              })}

              <div className="flex gap-3 leading-relaxed">
                <span className="flex w-4 shrink-0 flex-col text-text3">
                  {lineNumbers.map((lineNumber) => (
                    <span key={`marker-${lineNumber}`}>+</span>
                  ))}
                </span>
                <div className="flex w-10 shrink-0 flex-col text-right text-xs text-text3">
                  {lineNumbers.map((lineNumber) => (
                    <span key={`line-${lineNumber}`}>{lineNumber}</span>
                  ))}
                </div>
                <textarea
                  value={content}
                  onChange={(event) => onChange(event.target.value)}
                  className="flex-1 resize-none bg-transparent text-text1 outline-none leading-relaxed"
                  placeholder="O resultado da resolucao aparecera aqui..."
                  rows={resolvedLineCount}
                  wrap="off"
                  spellCheck={false}
                  disabled={disabled}
                />
              </div>

              {contextAfter.map((line, index) => {
                const lineNumber = contextAfterStartLine + index;
                return (
                  <div key={`after-${lineNumber}-${index}`} className="flex gap-3 leading-relaxed">
                    <span className="w-4 shrink-0 text-text3"> </span>
                    <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
                    <span className="whitespace-pre text-text3">{line === '' ? ' ' : line}</span>
                  </div>
                );
              })}
            </>
          ) : (
            previewLines.map((line) => {
              const lineValue = line.value === '' ? ' ' : line.value;
              const marker = line.kind === 'resolved' ? '+' : ' ';
              const background =
                line.kind === 'resolved' ? 'var(--diff-code-insert-background-color)' : 'transparent';
              const textClass = line.kind === 'resolved' ? 'text-text1' : 'text-text3';

              return (
                <div
                  key={line.id}
                  className="flex gap-3 leading-relaxed"
                  style={{ backgroundColor: background }}
                >
                  <span className="w-4 shrink-0 text-text3">{marker}</span>
                  <span className="w-10 shrink-0 text-right text-xs text-text3">{line.lineNumber}</span>
                  <span className={`whitespace-pre ${textClass}`}>{lineValue}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Panel>
  );
};
