import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/components/Panel';
import { Button } from '@/ui';
import { Save } from 'lucide-react';
import type { PreviewHighlight, PreviewLine } from '../utils/buildConflictPreview';

interface Props {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  canSave: boolean;
  isReadyToSave?: boolean;
  fullLines?: PreviewLine[];
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
  fullLines,
  disabled = false,
  isSaving = false,
  contextBefore,
  contextAfter,
  startLine,
}) => {
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = React.useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
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
  const resolveHighlight = (highlight?: PreviewHighlight) => {
    switch (highlight) {
      case 'ours':
        return {
          marker: '-',
          background: 'var(--diff-code-delete-background-color)',
          textClass: 'text-text1',
        };
      case 'theirs':
      case 'resolved':
        return {
          marker: '+',
          background: 'var(--diff-code-insert-background-color)',
          textClass: 'text-text1',
        };
      case 'marker':
        return {
          marker: '!',
          background: 'rgb(var(--status-warning-fg) / 0.12)',
          textClass: 'text-warningFg',
        };
      default:
        return {
          marker: ' ',
          background: 'transparent',
          textClass: 'text-text1',
        };
    }
  };

  const renderPreviewLines = (lines: PreviewLine[]) => {
    let foundFirst = false;
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const lineValue = line.text === '' ? ' ' : line.text;
      const { marker, background, textClass } = resolveHighlight(line.highlight);
      const isFirstDiff = !foundFirst && Boolean(line.highlight);
      if (isFirstDiff) {
        foundFirst = true;
      }

      return (
        <div
          key={`full-${index}`}
          className="flex gap-3 leading-relaxed"
          style={{ backgroundColor: background }}
          data-first-diff={isFirstDiff ? 'true' : undefined}
        >
          <span className="w-4 shrink-0 text-text3">{marker}</span>
          <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
          <span className={`whitespace-pre ${textClass}`}>{lineValue}</span>
        </div>
      );
    });
  };

  useEffect(() => {
    if (isEditing) return;
    const container = scrollRef.current;
    if (!container) return;
    const firstDiff = container.querySelector<HTMLElement>('[data-first-diff="true"]');
    if (firstDiff) {
      firstDiff.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fullLines, isEditing]);

  return (
    <Panel
      title={t('conflicts.result')}
      className="h-full"
      actions={
        <div className="flex items-center gap-3">
          {isReadyToSave && <span className="text-xs text-success">{t('conflicts.readyToSave')}</span>}
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setIsEditing((prev) => !prev)} disabled={disabled}>
              {isEditing ? t('conflicts.viewPreview') : t('conflicts.edit')}
            </Button>
            <Button size="sm" variant="primary" onClick={onSave} disabled={!canSave || disabled} isLoading={isSaving}>
              <Save size={14} />
              {t('conflicts.saveFile')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex h-full flex-col p-4">
        <div
          ref={scrollRef}
          className="diff-viewer flex-1 min-h-0 overflow-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-3 font-mono text-sm"
        >
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
                  placeholder={t('conflicts.resolutionPlaceholder')}
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
          ) : fullLines && fullLines.length > 0 ? (
            renderPreviewLines(fullLines)
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
