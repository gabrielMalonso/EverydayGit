import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { Panel } from '@/components/Panel';
import { ListItem } from '@/components/ListItem';
import { Badge } from '@/components/Badge';
import { AnimatedTabs } from '@/ui/AnimatedTabs';
import { SkeletonLine } from '@/ui/Skeleton';
import type { PullRequestItem, PrStatusFilter } from '@/types';

interface PrListPanelProps {
  prs: PullRequestItem[];
  statusFilter: PrStatusFilter;
  selectedPrNumber: number | null;
  isLoading: boolean;
  currentBranch: string | null;
  onFilterChange: (filter: PrStatusFilter) => void;
  onSelectPr: (prNumber: number) => void;
  onRefresh: () => void;
  onOpenDetail: () => void;
}

const parseDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const formatRelativeTime = (dateStr: string): string => {
  const date = parseDate(dateStr);
  if (!date) return '';

  const diffMs = Math.max(0, Date.now() - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes <= 0) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo`;

  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears}y`;
};

const filterTabs = [
  { key: 'open', label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'merged', label: 'Merged' },
];

const ChecksBadge: React.FC<{ checksStatus: string; t: (key: string) => string }> = ({ checksStatus, t }) => {
  switch (checksStatus) {
    case 'passing':
      return <Badge variant="success">{t('checks.passing')}</Badge>;
    case 'failing':
      return <Badge variant="danger">{t('checks.failing')}</Badge>;
    case 'pending':
      return <Badge variant="warning">{t('checks.pending')}</Badge>;
    default:
      return null;
  }
};

export const PrListPanel: React.FC<PrListPanelProps> = React.memo(({
  prs,
  statusFilter,
  selectedPrNumber,
  isLoading,
  currentBranch,
  onFilterChange,
  onSelectPr,
  onRefresh,
  onOpenDetail,
}) => {
  const { t } = useTranslation('pullRequests');

  // Localize filter tab labels
  const localizedFilterTabs = React.useMemo(() =>
    filterTabs.map((tab) => ({
      ...tab,
      label: t(`filters.${tab.key}`),
    })),
    [t],
  );

  const handleSelect = (prNumber: number) => {
    onSelectPr(prNumber);
    onOpenDetail();
  };

  return (
    <Panel
      title={t('list.title')}
      className="col-span-1 min-h-0"
      actions={
        <button
          type="button"
          onClick={onRefresh}
          className="inline-flex h-8 w-8 items-center justify-center rounded-button text-text2 transition-colors hover:bg-surface2/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
          aria-label={`Refresh ${t('list.title')}`}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
        </button>
      }
      headerLeft={
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-text1">
            <span className="block truncate">{t('list.title')}</span>
          </h3>
        </div>
      }
    >
      <div className="flex h-full min-h-0 flex-col">
        {/* Filter tabs */}
        <div className="shrink-0 border-b border-border1 px-4 py-2">
          <AnimatedTabs
            items={localizedFilterTabs}
            value={statusFilter}
            onChange={(val) => onFilterChange(val as PrStatusFilter)}
            ariaLabel="PR status filter"
            containerClassName="w-full justify-center"
            tabClassName="px-3 py-1.5 text-xs font-medium rounded-button transition-colors"
            activeTextClassName="text-text1"
            inactiveTextClassName="text-text3 hover:text-text2"
            indicatorClassName="rounded-button bg-primary/15"
          />
        </div>

        {/* PR list */}
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
              {t('list.emptyForFilter', { filter: t(`filters.${statusFilter}`) })}
            </div>
          ) : (
            prs.map((pr) => {
              const isCurrentBranch = currentBranch ? pr.head_ref_name === currentBranch : false;
              const isSelected = selectedPrNumber === pr.number;

              return (
                <ListItem
                  key={pr.number}
                  active={isSelected}
                  onClick={() => handleSelect(pr.number)}
                  aria-label={`PR #${pr.number}: ${pr.title}`}
                >
                  <div className="flex flex-col gap-1.5">
                    {/* Title row */}
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-xs font-mono text-text3">#{pr.number}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-text1">{pr.title}</span>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isCurrentBranch && (
                        <Badge variant="info">{t('list.currentBranch')}</Badge>
                      )}
                      {pr.is_draft && (
                        <Badge>{t('detail.draft')}</Badge>
                      )}
                      <ChecksBadge checksStatus={pr.checks_status} t={t} />
                      {pr.mergeable === 'CONFLICTING' && (
                        <span className="inline-flex items-center gap-1 text-xs text-danger">
                          <AlertTriangle size={12} />
                          {t('mergeable.CONFLICTING')}
                        </span>
                      )}
                    </div>

                    {/* Meta row */}
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
      </div>
    </Panel>
  );
});

PrListPanel.displayName = 'PrListPanel';
