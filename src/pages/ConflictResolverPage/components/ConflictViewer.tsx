import React from 'react';
import { Panel } from '@/components/Panel';
import { Button } from '@/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { ConflictHunk } from '@/types';

interface Props {
  hunk: ConflictHunk;
  currentIndex: number;
  totalHunks: number;
  onPrevious: () => void;
  onNext: () => void;
}

export const ConflictViewer: React.FC<Props> = ({
  hunk,
  currentIndex,
  totalHunks,
  onPrevious,
  onNext,
}) => {
  const oursLines = hunk.ours_content.split('\n');
  const theirsLines = hunk.theirs_content.split('\n');
  const maxConflictLines = Math.max(oursLines.length, theirsLines.length);
  const contextBeforeStart = Math.max(1, hunk.start_line - hunk.context_before.length);
  const conflictStart = hunk.start_line;
  const contextAfterStart = hunk.start_line + maxConflictLines;

  const renderLines = (lines: string[], startLine: number, muted: boolean) => {
    return lines.map((line, index) => {
      const lineNumber = startLine + index;
      const lineValue = line === '' ? ' ' : line;
      return (
        <div key={`${startLine}-${index}`} className="flex gap-3 leading-relaxed">
          <span className="w-10 shrink-0 text-right text-xs text-text3">{lineNumber}</span>
          <span className={`${muted ? 'text-text3' : 'text-text1'} whitespace-pre`}>
            {lineValue}
          </span>
        </div>
      );
    });
  };

  return (
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
          <div className="border-b border-border1 bg-info/10 px-3 py-2 text-xs font-semibold uppercase text-info">
            {hunk.ours_label || 'HEAD'} (branch atual)
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-sm">
            {renderLines(hunk.context_before, contextBeforeStart, true)}
            {renderLines(oursLines, conflictStart, false)}
            {renderLines(hunk.context_after, contextAfterStart, true)}
          </div>
        </div>

        <div className="flex flex-col rounded-md border border-border1 bg-surface2">
          <div className="border-b border-border1 bg-warning/10 px-3 py-2 text-xs font-semibold uppercase text-warning">
            {hunk.theirs_label || 'Incoming'} (branch entrando)
          </div>
          <div className="flex-1 overflow-auto p-3 font-mono text-sm">
            {renderLines(hunk.context_before, contextBeforeStart, true)}
            {renderLines(theirsLines, conflictStart, false)}
            {renderLines(hunk.context_after, contextAfterStart, true)}
          </div>
        </div>
      </div>
    </Panel>
  );
};
