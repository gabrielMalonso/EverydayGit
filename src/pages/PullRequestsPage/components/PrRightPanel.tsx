import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Panel } from '@/components/Panel';
import { AnimatedTabs } from '@/ui/AnimatedTabs';
import { PrDiffViewer } from './PrDiffViewer';
import { PrDetailsContent } from './PrDetailsContent';
import type { PullRequestDetail, PrReviewComment } from '@/types';

type PrViewMode = 'diff' | 'details';

interface PrRightPanelProps {
  prDiff: string | null;
  prDetail: PullRequestDetail | null;
  isDetailLoading: boolean;
  reviewComments: PrReviewComment[];
  selectedPrNumber: number | null;
  className?: string;
}

export const PrRightPanel: React.FC<PrRightPanelProps> = React.memo(({
  prDiff,
  prDetail,
  isDetailLoading,
  reviewComments,
  selectedPrNumber,
  className = '',
}) => {
  const { t } = useTranslation('pullRequests');
  const [activeView, setActiveView] = useState<PrViewMode>('diff');

  // No PR selected — show empty state without tabs
  if (selectedPrNumber === null) {
    return (
      <div className={`flex flex-col overflow-hidden rounded-card border border-border1 bg-surface1 shadow-card ${className}`}>
        <div className="flex h-full items-center justify-center text-sm text-text3">
          {t('diff.empty')}
        </div>
      </div>
    );
  }

  return (
    <Panel
      className={className}
      contentClassName="p-0"
      headerLeft={
        <AnimatedTabs
          items={[
            { key: 'diff', label: t('tabs.diff') },
            { key: 'details', label: t('tabs.details') },
          ]}
          value={activeView}
          onChange={(next) => setActiveView(next as PrViewMode)}
          ariaLabel="PR view mode"
          containerClassName="rounded-button border border-border1 bg-surface2 p-1.5"
          tabClassName="rounded-button px-3 py-1.5 text-[15px] font-medium transition-colors"
          activeTextClassName="text-text1"
          inactiveTextClassName="text-text3 hover:text-text1"
          indicatorClassName="rounded-button bg-surface1 shadow-subtle"
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-auto" role="tabpanel" id={`${activeView}-tab-panel`}>
        {activeView === 'diff' ? (
          <PrDiffViewer
            prDiff={prDiff}
            isLoading={isDetailLoading}
            reviewComments={reviewComments}
          />
        ) : (
          <PrDetailsContent
            detail={prDetail}
            isLoading={isDetailLoading}
          />
        )}
      </div>
    </Panel>
  );
});

PrRightPanel.displayName = 'PrRightPanel';
