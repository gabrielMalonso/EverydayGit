import React, { useEffect, useRef, useState } from 'react';
import { Panel } from '@/components/Panel';
import { Button, Modal } from '@/ui';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import type { ConflictHunk, ResolutionChoice } from '@/types';
import type { PreviewHighlight, PreviewLine } from '../utils/buildConflictPreview';

interface Props {
  hunk: ConflictHunk;
  fullOursLines?: PreviewLine[];
  fullTheirsLines?: PreviewLine[];
  currentIndex: number;
  totalHunks: number;
  selectedChoice?: ResolutionChoice;
  actionBar?: React.ReactNode;
  onPrevious: () => void;
  onNext: () => void;
}

export const ConflictViewer: React.FC<Props> = ({
  hunk,
  fullOursLines,
  fullTheirsLines,
  currentIndex,
  totalHunks,
  selectedChoice,
  actionBar,
  onPrevious,
  onNext,
}) => {
  const [expandedCard, setExpandedCard] = useState<'ours' | 'theirs' | null>(null);
  const oursScrollRef = useRef<HTMLDivElement>(null);
  const theirsScrollRef = useRef<HTMLDivElement>(null);
  const oursLabel = hunk.ours_label || 'HEAD';
  const theirsLabel = hunk.theirs_label || 'Incoming';
  const oursLines = hunk.ours_content.split('\n');
  const theirsLines = hunk.theirs_content.split('\n');
  const maxConflictLines = Math.max(oursLines.length, theirsLines.length);
  const contextBeforeStart = Math.max(1, hunk.start_line - hunk.context_before.length);
  const conflictStart = hunk.start_line;
  const contextAfterStart = hunk.start_line + maxConflictLines;
  const oursSelected = selectedChoice === 'ours' || selectedChoice === 'both';
  const theirsSelected = selectedChoice === 'theirs' || selectedChoice === 'both';

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

  const renderPreviewLines = (lines: PreviewLine[], markFirstDiff: boolean) => {
    let foundFirst = false;
    return lines.map((line, index) => {
      const lineNumber = index + 1;
      const lineValue = line.text === '' ? ' ' : line.text;
      const { marker, background, textClass } = resolveHighlight(line.highlight);
      const isFirstDiff = markFirstDiff && !foundFirst && Boolean(line.highlight);
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
          <span className={`${textClass} whitespace-pre-wrap break-words`}>{lineValue}</span>
        </div>
      );
    });
  };

  useEffect(() => {
    const scrollToFirstDiff = (container: HTMLDivElement | null) => {
      if (!container) return;
      const firstDiff = container.querySelector<HTMLElement>('[data-first-diff="true"]');
      if (firstDiff) {
        firstDiff.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    scrollToFirstDiff(oursScrollRef.current);
    scrollToFirstDiff(theirsScrollRef.current);
  }, [currentIndex, fullOursLines, fullTheirsLines]);

  return (
    <>
      <Panel
        title={`Conflito ${currentIndex + 1} de ${totalHunks}`}
        className="h-full"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            {actionBar}
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
          </div>
        }
      >
        <div className="grid h-full grid-cols-2 gap-2 p-4">
          <div
            className={`flex min-h-[320px] flex-col rounded-md border transition-all ${
              oursSelected
                ? 'border-infoFg/40 bg-infoBg ring-2 ring-infoFg/30'
                : 'border-border1 bg-surface2'
            }`}
          >
            <div className="flex items-center justify-between border-b border-border1 bg-infoBg px-3 py-2">
              <span className="text-xs font-semibold text-infoFg">{oursLabel}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedCard('ours')}
                aria-label={`Expandir visualizacao da branch ${oursLabel}`}
              >
                <Maximize2 size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden p-3 font-mono text-sm">
              <div
                ref={oursScrollRef}
                className="diff-viewer h-full overflow-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-3"
              >
                {fullOursLines && fullOursLines.length > 0
                  ? renderPreviewLines(fullOursLines, true)
                  : [
                      renderLines(hunk.context_before, contextBeforeStart, true, ' '),
                      renderLines(oursLines, conflictStart, false, '-', 'var(--diff-code-delete-background-color)'),
                      renderLines(hunk.context_after, contextAfterStart, true, ' '),
                    ]}
              </div>
            </div>
          </div>

          <div
            className={`flex min-h-[320px] flex-col rounded-md border transition-all ${
              theirsSelected
                ? 'border-warningFg/40 bg-warningBg ring-2 ring-warningFg/30'
                : 'border-border1 bg-surface2'
            }`}
          >
            <div className="flex items-center justify-between border-b border-border1 bg-warningBg px-3 py-2">
              <span className="text-xs font-semibold text-warningFg">{theirsLabel}</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setExpandedCard('theirs')}
                aria-label={`Expandir visualizacao da branch ${theirsLabel}`}
              >
                <Maximize2 size={14} />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden p-3 font-mono text-sm">
              <div
                ref={theirsScrollRef}
                className="diff-viewer h-full overflow-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-3"
              >
                {fullTheirsLines && fullTheirsLines.length > 0
                  ? renderPreviewLines(fullTheirsLines, true)
                  : [
                      renderLines(hunk.context_before, contextBeforeStart, true, ' '),
                      renderLines(theirsLines, conflictStart, false, '+', 'var(--diff-code-insert-background-color)'),
                      renderLines(hunk.context_after, contextAfterStart, true, ' '),
                    ]}
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
              ? `Visualizacao expandida - ${oursLabel}`
              : `Visualizacao expandida - ${theirsLabel}`
          }
        >
          <div className="flex h-full flex-col">
            <div
              className={`flex items-center justify-between px-4 py-3 ${
                expandedCard === 'ours' ? 'bg-infoBg' : 'bg-warningBg'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  expandedCard === 'ours' ? 'text-infoFg' : 'text-warningFg'
                }`}
              >
                {expandedCard === 'ours' ? oursLabel : theirsLabel}
              </span>
            </div>

            <div className="flex-1 overflow-auto p-4 font-mono text-sm">
              <div className="diff-viewer overflow-x-auto rounded-md border border-border1 bg-[rgb(8,8,12)] p-4">
                {expandedCard === 'ours'
                  ? renderPreviewLines(fullOursLines ?? [], false)
                  : renderPreviewLines(fullTheirsLines ?? [], false)}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
