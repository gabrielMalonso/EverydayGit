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
            {hunk.ours_label || 'HEAD'} (Atual)
          </div>
          <pre className="flex-1 overflow-auto p-3 font-mono text-sm text-text1">
            {hunk.ours_content || ' '}
          </pre>
        </div>

        <div className="flex flex-col rounded-md border border-border1 bg-surface2">
          <div className="border-b border-border1 bg-warning/10 px-3 py-2 text-xs font-semibold uppercase text-warning">
            {hunk.theirs_label || 'Incoming'} (Entrando)
          </div>
          <pre className="flex-1 overflow-auto p-3 font-mono text-sm text-text1">
            {hunk.theirs_content || ' '}
          </pre>
        </div>
      </div>
    </Panel>
  );
};
