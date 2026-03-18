import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ListItem } from '@/components/ListItem';
import { Badge } from '@/components/Badge';
import { SkeletonLine } from '@/ui/Skeleton';
import type { PullRequestItem } from '@/types';

interface PrListPanelProps {
  prs: PullRequestItem[];
  selectedPrNumber: number | null;
  isLoading: boolean;
  currentBranch: string | null;
  onSelectPr: (prNumber: number) => void;
  onRefresh: () => void;
}


export const PrListPanel: React.FC<PrListPanelProps> = React.memo(({
  prs,
  selectedPrNumber,
  isLoading,
  currentBranch,
  onSelectPr,
  onRefresh,
}) => {
  const { t, i18n } = useTranslation('pullRequests');

  const formatRelativeTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    const diffMs = Math.max(0, Date.now() - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto', style: 'narrow' });
    if (diffMinutes < 1) return rtf.format(0, 'minute');
    if (diffMinutes < 60) return rtf.format(-diffMinutes, 'minute');
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return rtf.format(-diffHours, 'hour');
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return rtf.format(-diffDays, 'day');
    const diffMonths = Math.floor(diffDays / 30);
    if (diffMonths < 12) return rtf.format(-diffMonths, 'month');
    return rtf.format(-Math.floor(diffMonths / 12), 'year');
  };

  return (
    <Panel
      className="col-span-1 min-h-0"
      actions={
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-button text-text2 transition-colors hover:bg-surface2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
          aria-label={t('list.refreshLabel')}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      }
      headerLeft={
        <h3 className="text-base font-semibold text-text1">
          <span className="block truncate">{t('list.title')}</span>
        </h3>
      }
    >
      <div className="min-h-0 flex-1 overflow-auto py-1">
        {isLoading && prs.length === 0 ? (
          <div className="space-y-3 px-4 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonLine className="w-3/4" />
                <SkeletonLine className="w-1/2 h-3" />
              </div>
            ))}
          </div>
        ) : prs.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 py-8 text-sm text-text3">
            {t('list.empty')}
          </div>
        ) : (
          prs.map((pr) => {
            const isCurrentBranch = currentBranch ? pr.head_ref_name === currentBranch : false;
            const isSelected = selectedPrNumber === pr.number;

            return (
              <ListItem
                key={pr.number}
                active={isSelected}
                onClick={() => onSelectPr(pr.number)}
                aria-label={`PR #${pr.number}: ${pr.title}`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 text-xs font-mono text-text3">#{pr.number}</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-text1">{pr.title}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {isCurrentBranch && (
                      <Badge variant="info">{t('list.currentBranch')}</Badge>
                    )}
                    {pr.is_draft && (
                      <Badge>{t('detail.draft')}</Badge>
                    )}
                    {pr.mergeable === 'CONFLICTING' && (
                      <span className="inline-flex items-center gap-1 text-xs text-danger">
                        <AlertTriangle size={12} />
                        {t('mergeable.CONFLICTING')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-text3">
                    <span>{pr.author_login}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate font-mono text-[10px]">
                      {pr.head_ref_name}
                      <span className="mx-1 text-text3" aria-hidden>&rarr;</span>
                      {pr.base_ref_name}
                    </span>
                    <span className="ml-auto shrink-0">{formatRelativeTime(pr.updated_at)}</span>
                  </div>
                </div>
              </ListItem>
            );
          })
        )}
      </div>
    </Panel>
  );
});

PrListPanel.displayName = 'PrListPanel';
