import React, { useState } from 'react';
import { Panel } from '@/components/Panel';
import { Button, Modal } from '@/ui';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { ConflictHunk } from '@/types';

interface Props {
  hunk: ConflictHunk;
  fullContent?: string;
  currentIndex: number;
  totalHunks: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ConflictViewer: React.FC<Props> = ({
  hunk,
  fullContent,
  currentIndex,
  totalHunks,
  onPrevious,
  onNext,
}) => {
  const [expandedCard, setExpandedCard] = useState<'ours' | 'theirs' | null>(null);
  const oursLines = hunk.ours_content.split('\n');
  const theirsLines = hunk.theirs_content.split('\n');
  const maxConflictLines = Math.max(oursLines.length, theirsLines.length);
  const contextBeforeStart = Math.max(1, hunk.start_line - hunk.context_before.length);
  const conflictStart = hunk.start_line;
  const contextAfterStart = hunk.start_line + maxConflictLines;

  const renderLines = (
    lines: string[],
    startLine: number,
    muted: boolean,
    marker: string,
    highlightColor?: string,
  ) => {
    return lines.map((line, index) => {
      const lineNumber = startLine + index;
      const lineValue = line === '' ? ' ' : line;
      return (
        <div
          key={`${startLine}-${index}`}
          className="flex gap-3 leading-relaxed"
          style={{ backgroundColor: highlightColor ?? 'transparent' }}
        >
          <span className="w-4 shrink-0 text-text3">{marker}</span>
          <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
          <span className={`${muted ? 'text-text3' : 'text-text1'} whitespace-pre-wrap break-words`}>{lineValue}</span>
        </div>
      );
    });
  };

  return (
    <>
      <Panel
        title={`Conflito ${currentIndex + 1} de ${totalHunks}`}
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onPrevious} disabled={currentIndex === 0}>
              <ChevronLeft size={16} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onNext}
              disabled={currentIndex === totalHunks - 1}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        }
      >
        <div className="grid h-full grid-cols-2 gap-2 p-4">
          <div className="flex flex-col rounded-md border border-border1 bg-surface2">
            <div className="flex items-center justify-between border-b border-border1 bg-info/10 px-3 py-2">
              <span className="text-xs font-semibold uppercase text-info">
                {hunk.ours_label || 'HEAD'} (branch atual)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedCard('ours')}
                aria-label="Expandir visualizacao da branch atual"
              >
                <Maximize2 size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-sm">
              <div className="diff-viewer rounded-md border border-border1 bg-[rgb(8,8,12)] p-3">
                {renderLines(hunk.context_before, contextBeforeStart, true, ' ')}
                {renderLines(oursLines, conflictStart, false, '-', 'var(--diff-code-delete-background-color)')}
                {renderLines(hunk.context_after, contextAfterStart, true, ' ')}
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-md border border-border1 bg-surface2">
            <div className="flex items-center justify-between border-b border-border1 bg-warning/10 px-3 py-2">
              <span className="text-xs font-semibold uppercase text-warning">
                {hunk.theirs_label || 'Incoming'} (branch entrando)
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedCard('theirs')}
                aria-label="Expandir visualizacao da branch entrando"
              >
                <Maximize2 size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-auto p-3 font-mono text-sm">
              <div className="diff-viewer rounded-md border border-border1 bg-[rgb(8,8,12)] p-3">
                {renderLines(hunk.context_before, contextBeforeStart, true, ' ')}
                {renderLines(theirsLines, conflictStart, false, '+', 'var(--diff-code-insert-background-color)')}
                {renderLines(hunk.context_after, contextAfterStart, true, ' ')}
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {expandedCard && (
        <Modal
          isOpen
          onClose={() => setExpandedCard(null)}
          panelClassName="!max-w-[95vw] w-[95vw] h-[85vh]"
          contentClassName="h-full overflow-hidden"
          ariaLabel={
            expandedCard === 'ours'
              ? 'Visualizacao expandida - Branch atual'
              : 'Visualizacao expandida - Branch entrando'
          }
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex items-center justify-between px-4 py-3 ${
                expandedCard === 'ours' ? 'bg-info/10' : 'bg-warning/10'
              }`}
            >
              <span
                className={`text-sm font-semibold uppercase ${
                  expandedCard === 'ours' ? 'text-info' : 'text-warning'
                }`}
              >
                {expandedCard === 'ours'
                  ? `${hunk.ours_label || 'HEAD'} (branch atual)`
                  : `${hunk.theirs_label || 'Incoming'} (branch entrando)`
                }
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              <div className="diff-viewer overflow-x-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-4">
                {fullContent ? (
                  fullContent.split('\n').map((line, index) => {
                    const lineNumber = index + 1;
                    const isConflictLine = lineNumber >= hunk.start_line && lineNumber <= hunk.end_line;
                    const lineValue = line === '' ? ' ' : line;

                    return (
                      <div
                        key={index}
                        className={`flex gap-3 leading-relaxed ${isConflictLine ? 'bg-warning/20' : ''}`}
                      >
                        <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
                        <span className={`whitespace-pre-wrap break-words ${isConflictLine ? 'text-warning' : 'text-text1'}`}>
                          {lineValue}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <>
                    {renderLines(hunk.context_before, contextBeforeStart, true, ' ')}
                    {expandedCard === 'ours'
                      ? renderLines(oursLines, conflictStart, false, '-', 'var(--diff-code-delete-background-color)')
                      : renderLines(theirsLines, conflictStart, false, '+', 'var(--diff-code-insert-background-color)')
                    }
                    {renderLines(hunk.context_after, contextAfterStart, true, ' ')}
                  </>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
