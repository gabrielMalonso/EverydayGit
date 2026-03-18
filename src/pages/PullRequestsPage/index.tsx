import React, { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTabPr } from '@/hooks/useTabPr';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { PrListPanel } from './components/PrListPanel';
import { PrRightPanel } from './components/PrRightPanel';
import { SectionSkeleton } from '@/ui/Skeleton';

export const PullRequestsPage: React.FC = React.memo(() => {
  const { t } = useTranslation('pullRequests');
  const {
    sortedPrs,
    reviewComments,
    currentBranch,
    selectedPrNumber,
    prDetail,
    prDiff,
    isLoading,
    isDetailLoading,
    hasGhCli,
    refreshPrs,
    selectPr,
    openPrOnGitHub,
    startPolling,
    stopPolling,
  } = useTabPr();
  const { setPage } = useTabNavigation();

  useEffect(() => {
    refreshPrs();
    startPolling();
    return () => stopPolling();
  }, [refreshPrs, startPolling, stopPolling]);

  const handleSelectPr = useCallback((prNumber: number) => {
    selectPr(prNumber);
  }, [selectPr]);

  if (hasGhCli === null) {
    return (
      <div className="grid h-full min-h-0 grid-cols-3 gap-4">
        <div className="col-span-1 flex flex-col gap-3">
          <SectionSkeleton lines={4} />
          <SectionSkeleton lines={3} />
          <SectionSkeleton lines={3} />
        </div>
        <div className="col-span-2">
          <SectionSkeleton lines={6} />
        </div>
      </div>
    );
  }

  if (hasGhCli === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-text2">
        <p className="text-sm">{t('errors.ghNotInstalled')}</p>
        <button
          type="button"
          onClick={() => setPage('setup')}
          className="rounded-button bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          {t('errors.goToSetup')}
        </button>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <PrListPanel
        prs={sortedPrs}
        selectedPrNumber={selectedPrNumber}
        isLoading={isLoading}
        currentBranch={currentBranch}
        onSelectPr={handleSelectPr}
        onRefresh={refreshPrs}
      />

      <PrRightPanel
        prDiff={prDiff}
        prDetail={prDetail}
        isDetailLoading={isDetailLoading}
        reviewComments={reviewComments}
        selectedPrNumber={selectedPrNumber}
        onOpenOnGitHub={openPrOnGitHub}
        className="col-span-2 min-h-0"
      />
    </div>
  );
});

PullRequestsPage.displayName = 'PullRequestsPage';
