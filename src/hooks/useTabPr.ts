import { useCallback, useEffect, useMemo, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from '@/hooks/useTabId';
import { isTauriRuntime } from '@/demo/demoMode';
import type { PullRequestItem, PullRequestDetail, PrStatusFilter } from '@/types';

const POLL_INTERVAL_MS = 30_000; // 30 seconds

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

  // Get methods via destructuring (stable references) — same pattern as useTabGit
  const { updateTabPr } = useTabStore();

  // Use a single selector for all tab-specific data to maintain stable hook order
  const tab = useTabStore((state) => state.tabs[tabId]);

  const repoPath = tab?.repoPath ?? null;
  const repoState = tab?.repoState ?? 'none';
  const isGitRepo = repoState === 'git';

  const pr = tab?.pr;

  // -- refreshPrs --
  // Busca lista de PRs do repositório atual.
  // Se o invoke falhar com mensagem indicando gh não encontrado, seta hasGhCli: false.
  const refreshPrs = useCallback(async (filter?: PrStatusFilter) => {
    if (!repoPath || !isGitRepo || !isTauriRuntime()) return;
    const statusFilter = filter ?? pr?.statusFilter ?? 'open';
    updateTabPr(tabId, { isLoading: true });
    try {
      const prs = await invoke<PullRequestItem[]>('list_pull_requests_cmd', {
        statusFilter,
        contextKey,
      });
      const currentPrs = pr?.prs ?? [];
      if (hasPrsChanged(currentPrs, prs)) {
        updateTabPr(tabId, { prs, isLoading: false, hasGhCli: true });
      } else {
        updateTabPr(tabId, { isLoading: false, hasGhCli: true });
      }
    } catch (error) {
      const msg = String(error).toLowerCase();
      if (msg.includes('gh') || msg.includes('not found') || msg.includes('not installed') || msg.includes('no such file')) {
        updateTabPr(tabId, { hasGhCli: false, isLoading: false, prs: [] });
      } else {
        updateTabPr(tabId, { isLoading: false, hasGhCli: true });
      }
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabPr, pr?.statusFilter, pr?.prs]);

  // -- setStatusFilter --
  const setStatusFilter = useCallback((filter: PrStatusFilter) => {
    updateTabPr(tabId, {
      statusFilter: filter,
      selectedPrNumber: null,
      prDetail: null,
      prDiff: null,
    });
  }, [tabId, updateTabPr]);

  // -- selectPr --
  // Carrega detail + diff quando usuário seleciona um PR.
  // Detail e diff são carregados em paralelo.
  const selectPr = useCallback(async (prNumber: number | null) => {
    updateTabPr(tabId, { selectedPrNumber: prNumber, prDetail: null, prDiff: null });
    if (prNumber === null || !repoPath || !isGitRepo || !isTauriRuntime()) return;

    updateTabPr(tabId, { isDetailLoading: true });
    try {
      const [detail, diff] = await Promise.all([
        invoke<PullRequestDetail>('get_pull_request_detail_cmd', { prNumber, contextKey }),
        invoke<string>('get_pull_request_diff_cmd', { prNumber, contextKey }),
      ]);
      updateTabPr(tabId, { prDetail: detail, prDiff: diff, isDetailLoading: false });
    } catch (error) {
      console.error('Failed to load PR detail:', error);
      toast.error(String(error) || 'Failed to load pull request details');
      updateTabPr(tabId, { isDetailLoading: false, selectedPrNumber: null, prDetail: null, prDiff: null });
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabPr]);

  // -- Polling --
  // Auto-refresh da lista a cada 30s.
  // IMPORTANTE: polling NÃO recarrega o detalhe do PR selecionado.
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

  // Cleanup on unmount
  useEffect(() => {
    return () => stopPolling();
  }, [stopPolling]);

  return useMemo(() => ({
    // State
    prs: pr?.prs ?? [],
    selectedPrNumber: pr?.selectedPrNumber ?? null,
    prDetail: pr?.prDetail ?? null,
    prDiff: pr?.prDiff ?? null,
    statusFilter: (pr?.statusFilter ?? 'open') as PrStatusFilter,
    isLoading: pr?.isLoading ?? false,
    isDetailLoading: pr?.isDetailLoading ?? false,
    hasGhCli: pr?.hasGhCli ?? null,
    // Actions
    refreshPrs,
    setStatusFilter,
    selectPr,
    startPolling,
    stopPolling,
  }), [
    pr?.prs, pr?.selectedPrNumber, pr?.prDetail, pr?.prDiff,
    pr?.statusFilter, pr?.isLoading, pr?.isDetailLoading, pr?.hasGhCli,
    refreshPrs, setStatusFilter, selectPr, startPolling, stopPolling,
  ]);
};
