import React from 'react';
import type { CommitInfo } from '@/types';
import { cn } from '@/lib/utils';
import { ListItem } from '@/components/ListItem';
import { CommitTooltipContent } from '@/pages/CommitsPage/components/CommitTooltipContent';
import { Tooltip, type TooltipPosition } from '@/ui';

export interface CommitsListProps {
  commits: CommitInfo[];
  className?: string;
  maxHeight?: string;
  emptyMessage?: string;
  tooltipPosition?: TooltipPosition;
}

const parseCommitDate = (dateStr: string): Date | null => {
  const direct = new Date(dateStr);
  if (!Number.isNaN(direct.getTime())) return direct;

  const match = dateStr.trim().match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})$/);
  if (!match) return null;

  const [, ymd, hms, tzRaw] = match;
  const tz = `${tzRaw.slice(0, 3)}:${tzRaw.slice(3)}`;
  const normalized = `${ymd}T${hms}${tz}`;
  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatRelativeTime = (dateStr: string): string => {
  const date = parseCommitDate(dateStr);
  if (!date) return '—';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes <= 0) return 'Now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const getSubject = (message: string): string => {
  const normalized = message.replace(/\r\n/g, '\n');
  const firstLine = normalized.split('\n')[0] ?? '';
  return firstLine.trimEnd() || message;
};

export const CommitsList: React.FC<CommitsListProps> = ({
  commits,
  className,
  maxHeight = 'max-h-36',
  emptyMessage = 'Sem commits',
  tooltipPosition = 'right',
}) => {
  if (commits.length === 0) {
    return (
      <div className={cn('overflow-auto text-text2', maxHeight, className)}>
        <div className="px-4 py-2 text-sm text-text3">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col overflow-auto text-text2', maxHeight, className)}>
      {commits.map((commit) => (
        <Tooltip
          key={commit.hash}
          delay={1000}
          position={tooltipPosition}
          contentClassName="p-0 overflow-hidden"
          containerClassName="border-highlight/50 ring-highlight/25"
          content={<CommitTooltipContent commit={commit} />}
        >
          <ListItem>
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium text-text1 truncate">{getSubject(commit.message)}</div>
              <div className="flex items-center gap-2 text-xs text-text3">
                <span>{commit.author}</span>
                <span>•</span>
                <span>{formatRelativeTime(commit.date)}</span>
                <span>•</span>
                <span className="font-mono">{commit.hash.substring(0, 7)}</span>
              </div>
            </div>
          </ListItem>
        </Tooltip>
      ))}
    </div>
  );
};
