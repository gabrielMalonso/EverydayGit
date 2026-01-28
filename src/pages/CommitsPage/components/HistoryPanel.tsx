import React from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/components/Panel';
import { ListItem } from '@/components/ListItem';
import { CommitTooltipContent } from './CommitTooltipContent';
import { CommitContextMenu } from './CommitContextMenu';
import { useTabGit } from '@/hooks/useTabGit';
import { Tooltip } from '@/ui';

interface HistoryPanelProps {
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = React.memo(({ className = '' }) => {
  const { t } = useTranslation('commits');
  const { commits } = useTabGit();

  // useEffect removido - TabContent.refreshAll() já carrega os commits

  const parseCommitDate = (dateStr: string) => {
    const direct = new Date(dateStr);
    if (!Number.isNaN(direct.getTime())) return direct;

    // git `%ai` format: `YYYY-MM-DD HH:MM:SS +ZZZZ`
    const match = dateStr.trim().match(
      /^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}:\d{2})\s+([+-]\d{4})$/,
    );
    if (!match) return null;

    const [, ymd, hms, tzRaw] = match;
    const tz = `${tzRaw.slice(0, 3)}:${tzRaw.slice(3)}`;
    const normalized = `${ymd}T${hms}${tz}`;
    const parsed = new Date(normalized);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = parseCommitDate(dateStr);
    if (!date) return '—';

    const diffMs = Math.max(0, Date.now() - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes <= 0) return t('history.now');
    if (diffMinutes < 60) return t('history.minutesAgo', { count: diffMinutes });

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return t('history.hoursAgo', { count: diffHours });

    const diffDays = Math.floor(diffHours / 24);
    return t('history.daysAgo', { count: diffDays });
  };

  const getSubject = (message: string) => {
    const normalized = message.replace(/\r\n/g, '\n');
    const firstLine = normalized.split('\n')[0] ?? '';
    return firstLine.trimEnd() || message;
  };

  return (
    <Panel title={t('history.title')} className={className}>
      <div className="flex flex-col">
        {commits.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text-secondary">
            {t('history.noCommits')}
          </div>
        ) : (
          commits.map((commit) => (
            <CommitContextMenu key={commit.hash} commit={commit}>
              <Tooltip
                delay={1000}
                position="right"
                contentClassName="p-0 overflow-hidden"
                containerClassName="border-highlight/50 ring-highlight/25"
                content={<CommitTooltipContent commit={commit} />}
              >
                <ListItem>
                  <div className="flex flex-col gap-1">
                    <div className="text-sm text-text-primary font-medium">
                      {getSubject(commit.message)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                      <span>{commit.author}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(commit.date)}</span>
                      <span>•</span>
                      <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                    </div>
                  </div>
                </ListItem>
              </Tooltip>
            </CommitContextMenu>
          ))
        )}
      </div>
    </Panel>
  );
});

HistoryPanel.displayName = 'HistoryPanel';
