import { useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from '@/hooks/useTabId';
import { isDemoMode, isTauriRuntime } from '@/demo/demoMode';
import { demoPullRequests, demoPullRequestDetailMap, demoPullRequestDiff } from '@/demo/fixtures';
import type { PullRequestItem, PullRequestDetail } from '@/types';

const POLL_INTERVAL_MS = 30_000;

const hasPrsChanged = (prev: PullRequestItem[], next: PullRequestItem[]): boolean => {
  if (prev.length !== next.length) return true;
  for (let i = 0; i < prev.length; i++) {
    if (prev[i].number !== next[i].number || prev[i].updated_at !== next[i].updated_at) return true;
  }
  return false;
};

export const useTabPr = () => {
  const tabId = useCurrentTabId();
  const contextKey = useContextKey();

  const { updateTabPr } = useTabStore();
  const tab = useTabStore((state) => state.tabs[tabId]);

  const repoPath = tab?.repoPath ?? null;
  const repoState = tab?.repoState ?? 'none';
  const isGitRepo = repoState === 'git';

  const pr = tab?.pr;
  const prs = pr?.prs ?? [];

  const currentBranch = tab?.git?.status?.current_branch ?? null;

  const sortedPrs = useMemo(() => {
    return [...prs].sort((a, b) => {
      const aIsCurrent = currentBranch ? a.head_ref_name === currentBranch : false;
      const bIsCurrent = currentBranch ? b.head_ref_name === currentBranch : false;
      if (aIsCurrent && !bIsCurrent) return -1;
      if (!aIsCurrent && bIsCurrent) return 1;
      return b.number - a.number;
    });
  }, [prs, currentBranch]);

  const reviewComments = useMemo(() => {
    const detail = pr?.prDetail;
    if (!detail) return [];
    return detail.reviews.flatMap((review) => review.comments);
  }, [pr?.prDetail]);

  // Use a ref so refreshPrs can read the latest prs without it being a dependency,
  // preventing unnecessary identity changes that cause double-fetches on every poll.
  const prsRef = useRef(prs);
  prsRef.current = prs;

  const refreshPrs = useCallback(async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      if (prsRef.current.length === 0) {
        updateTabPr(tabId, { isLoading: true });
      }
      updateTabPr(tabId, { prs: demoPullRequests, isLoading: false, hasGhCli: true });
      return;
    }

    if (!isTauriRuntime()) return;

    if (prsRef.current.length === 0) {
      updateTabPr(tabId, { isLoading: true });
    }

    try {
      const freshPrs = await invoke<PullRequestItem[]>('list_pull_requests_cmd', { contextKey });
      if (hasPrsChanged(prsRef.current, freshPrs)) {
        updateTabPr(tabId, { prs: freshPrs, isLoading: false, hasGhCli: true });
      } else {
        updateTabPr(tabId, { isLoading: false, hasGhCli: true });
      }
    } catch (error) {
      const msg = String(error).toLowerCase();
      if (msg.includes('gh') || msg.includes('not found') || msg.includes('not installed') || msg.includes('no such file')) {
        updateTabPr(tabId, { hasGhCli: false, isLoading: false });
      } else {
        updateTabPr(tabId, { isLoading: false, hasGhCli: true });
      }
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabPr]);

  const selectPr = useCallback(async (prNumber: number | null) => {
    updateTabPr(tabId, { selectedPrNumber: prNumber, prDetail: null, prDiff: null });
    if (prNumber === null || !repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      const detail = demoPullRequestDetailMap[prNumber] ?? null;
      updateTabPr(tabId, {
        prDetail: detail,
        prDiff: detail ? demoPullRequestDiff : null,
        isDetailLoading: false,
      });
      return;
    }

    if (!isTauriRuntime()) return;

    updateTabPr(tabId, { isDetailLoading: true });
    try {
      const [detail, diff] = await Promise.all([
        invoke<PullRequestDetail>('get_pull_request_detail_cmd', { prNumber, contextKey }),
        invoke<string>('get_pull_request_diff_cmd', { prNumber, contextKey }),
      ]);
      // Guard: se usuario selecionou outro PR enquanto buscavamos, descartar
      const currentSelected = useTabStore.getState().tabs[tabId]?.pr?.selectedPrNumber;
      if (currentSelected !== prNumber) return;
      updateTabPr(tabId, { prDetail: detail, prDiff: diff, isDetailLoading: false });
    } catch (error) {
      console.error('Failed to load PR detail:', error);
      toast.error(String(error) || 'Failed to load pull request details');
      updateTabPr(tabId, { isDetailLoading: false, selectedPrNumber: null, prDetail: null, prDiff: null });
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabPr]);

  const openPrOnGitHub = useCallback(async (url: string | undefined) => {
    if (!url) return;
    try {
      if (isTauriRuntime()) {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  }, []);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollIntervalRef.current = setInterval(() => {
      refreshPrs();
    }, POLL_INTERVAL_MS);
  }, [refreshPrs]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return useMemo(() => ({
    prs,
    sortedPrs,
    reviewComments,
    currentBranch,
    selectedPrNumber: pr?.selectedPrNumber ?? null,
    prDetail: pr?.prDetail ?? null,
    prDiff: pr?.prDiff ?? null,
    isLoading: pr?.isLoading ?? false,
    isDetailLoading: pr?.isDetailLoading ?? false,
    hasGhCli: pr?.hasGhCli ?? null,
    refreshPrs,
    selectPr,
    openPrOnGitHub,
    startPolling,
    stopPolling,
  }), [
    prs, sortedPrs, reviewComments, currentBranch,
    pr?.selectedPrNumber, pr?.prDetail, pr?.prDiff,
    pr?.isLoading, pr?.isDetailLoading, pr?.hasGhCli,
    refreshPrs, selectPr, openPrOnGitHub, startPolling, stopPolling,
  ]);
};
