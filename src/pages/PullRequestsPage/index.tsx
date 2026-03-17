import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTabPr } from '@/hooks/useTabPr';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { PrListPanel } from './components/PrListPanel';
import { PrDiffViewer } from './components/PrDiffViewer';
import { PrDetailSheet } from './components/PrDetailSheet';
import { SectionSkeleton } from '@/ui/Skeleton';
import type { PrStatusFilter } from '@/types';

export const PullRequestsPage: React.FC = React.memo(() => {
  const { t } = useTranslation('pullRequests');
  const {
    prs,
    selectedPrNumber,
    prDetail,
    prDiff,
    statusFilter,
    isLoading,
    isDetailLoading,
    hasGhCli,
    refreshPrs,
    setStatusFilter,
    selectPr,
    startPolling,
    stopPolling,
  } = useTabPr();
  const { status } = useTabGit();
  const { setPage } = useTabNavigation();

  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const currentBranch = status?.current_branch ?? null;

  // Mount: refresh + start polling; unmount: stop polling
  useEffect(() => {
    refreshPrs();
    startPolling();
    return () => stopPolling();
  }, [refreshPrs, startPolling, stopPolling]);

  // Re-fetch when statusFilter changes
  useEffect(() => {
    refreshPrs(statusFilter);
  }, [statusFilter, refreshPrs]);

  // Sort PRs: current branch first, then by number descending
  const sortedPrs = useMemo(() => {
    const sorted = [...prs].sort((a, b) => {
      const aIsCurrent = currentBranch ? a.head_ref_name === currentBranch : false;
      const bIsCurrent = currentBranch ? b.head_ref_name === currentBranch : false;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return b.number - a.number;
    });
    return sorted;
  }, [prs, currentBranch]);

  // Collect review comments from detail for diff inline display
  const reviewComments = useMemo(() => {
    if (!prDetail) return [];
    return prDetail.reviews.flatMap((review) => review.comments);
  }, [prDetail]);

  const handleSelectPr = useCallback((prNumber: number) => {
    selectPr(prNumber);
  }, [selectPr]);

  const handleFilterChange = useCallback((filter: PrStatusFilter) => {
    setStatusFilter(filter);
  }, [setStatusFilter]);

  const handleRefresh = useCallback(() => {
    refreshPrs(statusFilter);
  }, [refreshPrs, statusFilter]);

  const handleOpenDetail = useCallback(() => {
    setIsDetailOpen(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
  }, []);

  // Initial state: still checking if gh CLI is available
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

  // If gh CLI is not available, show error message
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
        statusFilter={statusFilter}
        selectedPrNumber={selectedPrNumber}
        isLoading={isLoading}
        currentBranch={currentBranch}
        onFilterChange={handleFilterChange}
        onSelectPr={handleSelectPr}
        onRefresh={handleRefresh}
        onOpenDetail={handleOpenDetail}
      />

      <PrDiffViewer
        prDiff={prDiff}
        isLoading={isDetailLoading}
        reviewComments={reviewComments}
        className="col-span-2 min-h-0"
      />

      <PrDetailSheet
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        detail={prDetail}
        isLoading={isDetailLoading}
      />
    </div>
  );
});

PullRequestsPage.displayName = 'PullRequestsPage';
