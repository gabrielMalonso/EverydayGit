import { useCallback, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from '@/hooks/useTabId';
import { useToastStore } from '@/stores/toastStore';
import type {
  RepoStatus,
  Branch,
  CommitInfo,
  BranchComparison,
  MergePreview,
  MergeResult,
  Worktree,
} from '@/types';
import { isDemoMode } from '@/demo/demoMode';
import { demoBranches, demoCommits, demoConflictFiles, demoDiffByFile, demoStatus } from '@/demo/fixtures';
import { getWindowLabel } from './useWindowLabel';

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
};

const isMergeInProgressError = (error: unknown) => {
  return getErrorMessage(error).toLowerCase().includes('merge is in progress');
};

export const useTabGit = () => {
  const tabId = useCurrentTabId();
  const contextKey = useContextKey();
  const { showToast } = useToastStore();

  // Get methods via destructuring (stable references)
  const { updateTabGit, updateTabMerge } = useTabStore();

  // Use a single selector for all tab-specific data to maintain stable hook order
  const tab = useTabStore((state) => state.tabs[tabId]);

  const repoPath = tab?.repoPath ?? null;
  const repoState = tab?.repoState ?? 'none';
  const isGitRepo = repoState === 'git';
  const git = tab?.git;

  const refreshStatus = useCallback(async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      // Read current status via getState() to avoid dependency
      const currentGit = useTabStore.getState().tabs[tabId]?.git;
      if (!currentGit?.status) {
        updateTabGit(tabId, { status: demoStatus });
        updateTabMerge(tabId, { isMergeInProgress: demoConflictFiles.length > 0, conflictCount: demoConflictFiles.length });
      }
      return;
    }

    try {
      const status = await invoke<RepoStatus>('get_git_status', { contextKey });
      updateTabGit(tabId, { status });
      const [inProgress, conflicts] = await invoke<[boolean, string[]]>('is_merge_in_progress_cmd', { contextKey });
      updateTabMerge(tabId, { isMergeInProgress: inProgress, conflictCount: conflicts.length });
    } catch (error) {
      console.error('Failed to get git status:', error);
      throw error;
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabGit, updateTabMerge]); // ✅ Stable deps - removed git?.status

  const refreshBranches = useCallback(async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      updateTabGit(tabId, { branches: demoBranches });
      return;
    }

    try {
      const branches = await invoke<Branch[]>('get_branches_cmd', { contextKey });
      updateTabGit(tabId, { branches });
    } catch (error) {
      console.error('Failed to get branches:', error);
      throw error;
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabGit]);

  const refreshCommits = useCallback(async (limit: number = 50) => {
    if (!repoPath || !isGitRepo) return;

    console.log('[DEBUG] refreshCommits called', { tabId, repoPath, isGitRepo, limit });

    if (isDemoMode()) {
      updateTabGit(tabId, { commits: demoCommits.slice(0, limit) });
      return;
    }

    try {
      const commits = await invoke<CommitInfo[]>('get_commit_log', { limit, contextKey });
      console.log('[DEBUG] Backend returned commits:', commits.length, commits.slice(0, 2));
      updateTabGit(tabId, { commits });
      console.log('[DEBUG] updateTabGit called with commits:', commits.length);
    } catch (error) {
      console.error('Failed to get commits:', error);
      throw error;
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabGit]);

  const refreshWorktrees = useCallback(async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      updateTabGit(tabId, { worktrees: [] });
      return;
    }

    try {
      const worktrees = await invoke<Worktree[]>('get_worktrees_cmd', { contextKey });
      updateTabGit(tabId, { worktrees });
    } catch (error) {
      console.error('Failed to get worktrees:', error);
      updateTabGit(tabId, { worktrees: [] });
    }
  }, [repoPath, isGitRepo, tabId, contextKey, updateTabGit]);

  const refreshAll = useCallback(async (commitsLimit: number = 50) => {
    console.log('[DEBUG] refreshAll ENTRY', { tabId, repoPath, isGitRepo, limit: commitsLimit });
    if (!repoPath || !isGitRepo) {
      console.log('[DEBUG] refreshAll GUARD FAILED - returning early');
      return;
    }

    console.log('[DEBUG] refreshAll EXECUTING', { tabId, repoPath, limit: commitsLimit });
    await Promise.all([refreshStatus(), refreshBranches(), refreshWorktrees(), refreshCommits(commitsLimit)]);

    const current = useTabStore.getState().getTab(tabId);
    const status = current?.git?.status;
    const selectedFile = current?.git?.selectedFile;
    if (selectedFile && !status?.files.some((file) => file.path === selectedFile)) {
      updateTabGit(tabId, { selectedFile: null, selectedDiff: null });
    }
  }, [repoPath, isGitRepo, tabId, updateTabGit, refreshStatus, refreshBranches, refreshWorktrees, refreshCommits]);

  const stageFile = async (filePath: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return;
      const nextFiles = current.files.map((file) => (file.path === filePath ? { ...file, staged: true } : file));
      updateTabGit(tabId, { status: { ...current, files: nextFiles } });
      return;
    }

    try {
      await invoke('stage_file_cmd', { filePath, contextKey });
      await refreshStatus();
    } catch (error) {
      if (isMergeInProgressError(error)) {
        showToast('Stage bloqueado durante merge. Resolva os conflitos primeiro.', 'warning');
        return;
      }
      console.error('Failed to stage file:', error);
      throw error;
    }
  };

  const stageAll = async () => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return;
      const nextFiles = current.files.map((file) => {
        if (file.staged) return file;
        const nextStatus = file.status === 'Untracked' ? 'Added' : file.status;
        return { ...file, staged: true, status: nextStatus };
      });
      updateTabGit(tabId, { status: { ...current, files: nextFiles } });
      return;
    }

    try {
      await invoke('stage_all_cmd', { contextKey });
      await refreshStatus();
    } catch (error) {
      if (isMergeInProgressError(error)) {
        showToast('Stage bloqueado durante merge. Resolva os conflitos primeiro.', 'warning');
        return;
      }
      console.error('Failed to stage all files:', error);
      throw error;
    }
  };

  const unstageFile = async (filePath: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return;
      const nextFiles = current.files.map((file) => (file.path === filePath ? { ...file, staged: false } : file));
      updateTabGit(tabId, { status: { ...current, files: nextFiles } });
      return;
    }

    try {
      await invoke('unstage_file_cmd', { filePath, contextKey });
      await refreshStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
      throw error;
    }
  };

  const commit = async (message: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentStatus = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!currentStatus) return;

      const stagedFiles = currentStatus.files.filter((file) => file.staged);
      const remainingFiles = currentStatus.files.filter((file) => !file.staged);

      const newCommit: CommitInfo = {
        hash: Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40),
        message,
        author: 'demo-user',
        date: new Date().toISOString(),
      };

      const currentCommits = useTabStore.getState().getTab(tabId)?.git?.commits ?? [];
      updateTabGit(tabId, {
        commits: [newCommit, ...currentCommits],
        status: { ...currentStatus, files: remainingFiles, ahead: currentStatus.ahead + 1 },
      });

      if (stagedFiles.some((f) => f.path === useTabStore.getState().getTab(tabId)?.git?.selectedFile)) {
        updateTabGit(tabId, { selectedDiff: '' });
      }
      return;
    }

    try {
      await invoke('commit_cmd', { message, contextKey });
      await refreshStatus();
      await refreshCommits();
      showToast('Commit realizado!', 'success');
    } catch (error) {
      console.error('Failed to commit:', error);
      showToast('Falha no commit', 'error');
      throw error;
    }
  };

  const amendCommit = async (message: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentStatus = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!currentStatus) return;

      const currentCommits = useTabStore.getState().getTab(tabId)?.git?.commits ?? [];
      if (currentCommits.length === 0) {
        showToast('Nenhum commit para amend', 'error');
        return;
      }

      const stagedFiles = currentStatus.files.filter((file) => file.staged);
      const remainingFiles = currentStatus.files.filter((file) => !file.staged);

      const amendedCommit: CommitInfo = {
        ...currentCommits[0],
        hash: Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40),
        message,
        date: new Date().toISOString(),
      };

      updateTabGit(tabId, {
        commits: [amendedCommit, ...currentCommits.slice(1)],
        status: { ...currentStatus, files: remainingFiles },
      });

      if (stagedFiles.some((f) => f.path === useTabStore.getState().getTab(tabId)?.git?.selectedFile)) {
        updateTabGit(tabId, { selectedDiff: '' });
      }

      showToast('Amend realizado! (demo)', 'success');
      return;
    }

    try {
      await invoke('amend_commit_cmd', { message, contextKey });
      await refreshStatus();
      await refreshCommits();
      showToast('Amend realizado!', 'success');
    } catch (error) {
      console.error('Failed to amend commit:', error);
      showToast('Falha no amend', 'error');
      throw error;
    }
  };

  const isLastCommitPushed = async (): Promise<boolean> => {
    if (!repoPath || !isGitRepo || isDemoMode()) return false;

    try {
      return await invoke<boolean>('is_last_commit_pushed_cmd', { contextKey });
    } catch (error) {
      console.error('Failed to check if last commit was pushed:', error);
      return false;
    }
  };

  const push = async () => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return '';
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return 'Demo: nothing to push';
      const nextAhead = Math.max(0, current.ahead - 1);
      updateTabGit(tabId, { status: { ...current, ahead: nextAhead } });
      return 'Demo: pushed successfully';
    }

    try {
      const result = await invoke<string>('push_cmd', { contextKey });
      await refreshStatus();
      showToast('Push realizado!', 'success');
      return result;
    } catch (error) {
      console.error('Failed to push:', error);
      showToast('Falha no push', 'error');
      throw error;
    }
  };

  const pull = async () => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return '';
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return 'Demo: nothing to pull';
      updateTabGit(tabId, { status: { ...current, behind: 0 } });
      return 'Demo: pulled successfully';
    }

    try {
      const result = await invoke<string>('pull_cmd', { contextKey });
      await refreshStatus();
      await refreshCommits();
      showToast('Pull realizado!', 'success');
      return result;
    } catch (error) {
      console.error('Failed to pull:', error);
      showToast('Falha no pull', 'error');
      throw error;
    }
  };

  const checkoutBranch = async (branchName: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentBranches = useTabStore.getState().getTab(tabId)?.git?.branches ?? [];
      const nextBranches = currentBranches.map((branch) => ({
        ...branch,
        current: !branch.remote && branch.name === branchName,
      }));
      updateTabGit(tabId, { branches: nextBranches });
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (current) updateTabGit(tabId, { status: { ...current, current_branch: branchName } });
      await refreshCommits();
      return;
    }

    try {
      await invoke('checkout_branch_cmd', { branchName, contextKey });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      showToast(`Branch "${branchName}" ativada`, 'success');
    } catch (error) {
      console.error('Failed to checkout branch:', error);
      showToast('Falha ao trocar branch', 'error');
      throw error;
    }
  };

  const checkoutRemoteBranch = async (remoteRef: string) => {
    const localName = remoteRef.replace(/^[^/]+\//, '');

    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentBranches = useTabStore.getState().getTab(tabId)?.git?.branches ?? [];

      const newBranch: Branch = {
        name: localName,
        current: true,
        remote: false,
      };

      const updatedBranches = currentBranches.map((b) => ({
        ...b,
        current: false,
      }));
      updatedBranches.push(newBranch);

      updateTabGit(tabId, { branches: updatedBranches });

      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (current) {
        updateTabGit(tabId, { status: { ...current, current_branch: localName } });
      }

      await refreshCommits();
      return;
    }

    try {
      await invoke('checkout_remote_branch_cmd', { remoteRef, contextKey });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      showToast(`Branch "${localName}" criada e ativada`, 'success');
    } catch (error) {
      console.error('Failed to checkout remote branch:', error);
      showToast('Falha ao criar branch local', 'error');
      throw error;
    }
  };

  const createBranch = async (name: string, from?: string, pushToRemote: boolean = false, checkout: boolean = true) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentBranches = useTabStore.getState().getTab(tabId)?.git?.branches ?? [];
      const nextBranches = currentBranches.map((b) => ({ ...b, current: checkout ? false : b.current }));
      nextBranches.push({ name, current: checkout, remote: false });
      updateTabGit(tabId, { branches: nextBranches });
      if (checkout) {
        const status = useTabStore.getState().getTab(tabId)?.git?.status;
        if (status) {
          updateTabGit(tabId, { status: { ...status, current_branch: name } });
        }
      }
      await refreshCommits();
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[Action] Starting createBranch', { name, from, pushToRemote, checkout });
    }

    try {
      await invoke('create_branch_cmd', {
        name,
        from: from ?? null,
        pushToRemote,
        checkout,
        contextKey,
      });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      if (import.meta.env.DEV) {
        console.log('[Action] createBranch completed successfully', { name });
      }
      showToast(`Branch "${name}" criada${pushToRemote ? ' e publicada' : ''}`, 'success');
    } catch (error) {
      console.error('[Action] createBranch failed', { error });
      showToast(pushToRemote ? 'Falha ao publicar branch no remoto' : 'Falha ao criar branch', 'error');
      throw error;
    }
  };

  const deleteBranch = async (name: string, force = false, isRemote = false) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentBranches = useTabStore.getState().getTab(tabId)?.git?.branches ?? [];
      const nextBranches = currentBranches.filter((b) => b.name !== name);
      updateTabGit(tabId, { branches: nextBranches });
      return;
    }

    try {
      await invoke('delete_branch_cmd', { name, force, isRemote, contextKey });
      await refreshBranches();
      await refreshStatus();
      showToast(`Branch "${name}" removida`, 'success');
    } catch (error) {
      console.error('Failed to delete branch:', error);
      showToast('Falha ao remover branch', 'error');
      throw error;
    }
  };

  const mergePreview = useCallback(
    async (source: string, target?: string) => {
      if (isDemoMode()) {
        const preview: MergePreview = {
          can_fast_forward: false,
          conflicts: ['src/App.tsx', 'README.md'],
          files_changed: 3,
          insertions: 42,
          deletions: 7,
        };
        updateTabGit(tabId, { selectedDiff: '' });
        return preview;
      }

      if (!repoPath || !isGitRepo) {
        return {
          can_fast_forward: false,
          conflicts: [],
          files_changed: 0,
          insertions: 0,
          deletions: 0,
        };
      }

      try {
        const preview = await invoke<MergePreview>('merge_preview_cmd', { source, target, contextKey });
        return preview;
      } catch (error) {
        console.error('Failed to preview merge:', error);
        throw error;
      }
    },
    [repoPath, isGitRepo, tabId, contextKey, updateTabGit],
  );

  const mergeBranch = async (source: string, message?: string) => {
    if (isDemoMode()) {
      const result: MergeResult = {
        fast_forward: false,
        summary: `Merged ${source} into current (demo)`,
        conflicts: demoConflictFiles,
      };
      return result;
    }

    if (!repoPath || !isGitRepo) {
      return { fast_forward: false, summary: '', conflicts: [] };
    }

    try {
      const result = await invoke<MergeResult>('merge_branch_cmd', { source, message, contextKey });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      if (result.conflicts.length > 0) {
        showToast(`Merge iniciado com ${result.conflicts.length} conflito(s)`, 'warning');
      }
      return result;
    } catch (error) {
      console.error('Failed to merge branch:', error);
      showToast('Falha no merge', 'error');
      throw error;
    }
  };

  const checkMergeInProgress = useCallback(async () => {
    if (isDemoMode()) {
      return {
        inProgress: demoConflictFiles.length > 0,
        conflicts: demoConflictFiles,
      };
    }

    // Guard - retorna early se não há repositório válido
    if (!repoPath || !isGitRepo) {
      return { inProgress: false, conflicts: [] as string[] };
    }

    try {
      const [inProgress, conflicts] = await invoke<[boolean, string[]]>('is_merge_in_progress_cmd', { contextKey });
      return { inProgress, conflicts };
    } catch (error) {
      console.error('Failed to check merge status:', error);
      throw error;
    }
  }, [repoPath, isGitRepo, contextKey]);

  const completeMerge = useCallback(
    async (message?: string) => {
      if (isDemoMode()) {
        showToast('Merge concluido com sucesso!', 'success');
        return 'Demo: merge completed.';
      }

      if (!repoPath || !isGitRepo) return '';

      try {
        const result = await invoke<string>('complete_merge_cmd', { message, contextKey });
        await refreshStatus();
        await refreshBranches();
        await refreshCommits();
        showToast('Merge concluido com sucesso!', 'success');
        return result;
      } catch (error) {
        console.error('Failed to complete merge:', error);
        throw error;
      }
    },
    [repoPath, isGitRepo, showToast, contextKey],
  );

  const compareBranches = useCallback(
    async (base: string, compare: string) => {
      if (isDemoMode()) {
        const comparison: BranchComparison = {
          ahead: 2,
          behind: 1,
          commits: demoCommits.slice(0, 5),
          diff_summary: 'Demo diff summary',
        };
        return comparison;
      }

      if (!repoPath || !isGitRepo) {
        return {
          ahead: 0,
          behind: 0,
          commits: [],
          diff_summary: '',
        };
      }

      try {
        const comparison = await invoke<BranchComparison>('compare_branches_cmd', {
          base,
          compare,
          contextKey,
        });
        return comparison;
      } catch (error) {
        console.error('Failed to compare branches:', error);
        throw error;
      }
    },
    [repoPath, isGitRepo, contextKey],
  );

  const getFileDiff = async (filePath: string, staged: boolean) => {
    if (isDemoMode()) {
      const entry = demoDiffByFile[filePath];
      const preferred = staged ? entry?.staged : entry?.unstaged;
      const fallback = staged ? entry?.unstaged : entry?.staged;
      const diff = preferred && preferred.trim() ? preferred : fallback ?? '';
      updateTabGit(tabId, { selectedDiff: diff });
      return diff;
    }

    if (!repoPath || !isGitRepo) return '';

    try {
      const diff = await invoke<string>('get_file_diff', { filePath, staged, contextKey });
      updateTabGit(tabId, { selectedDiff: diff });
      return diff;
    } catch (error) {
      console.error('Failed to get file diff:', error);
      throw error;
    }
  };

  const getAllDiff = async (staged: boolean) => {
    if (isDemoMode()) {
      const current = useTabStore.getState().getTab(tabId)?.git?.status;
      if (!current) return '';
      const files = current.files.filter((file) => file.staged === staged);
      const diffs = files
        .map((file) => {
          const entry = demoDiffByFile[file.path];
          const preferred = staged ? entry?.staged : entry?.unstaged;
          const fallback = staged ? entry?.unstaged : entry?.staged;
          return preferred && preferred.trim() ? preferred : fallback;
        })
        .filter(Boolean)
        .join('\n');
      return diffs;
    }

    if (!repoPath || !isGitRepo) return '';

    try {
      const diff = await invoke<string>('get_all_diff_cmd', { staged, contextKey });
      return diff;
    } catch (error) {
      console.error('Failed to get all diff:', error);
      throw error;
    }
  };

  const resetBranch = async (hash: string, mode: 'soft' | 'mixed' | 'hard' | 'keep') => {
    if (!repoPath || !isGitRepo) return;

    if (import.meta.env.DEV) {
      console.log('[Action] Starting reset', { hash, mode });
    }

    try {
      await invoke('reset_cmd', { hash, mode, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] reset completed successfully', { hash, mode });
      }
      await refreshAll();
      showToast(`Reset (${mode}) realizado com sucesso!`, 'success');
    } catch (error) {
      console.error('[Action] reset failed', { error });
      showToast('Falha no reset', 'error');
      throw error;
    }
  };

  const cherryPick = async (hash: string) => {
    if (!repoPath || !isGitRepo) return;

    if (import.meta.env.DEV) {
      console.log('[Action] Starting cherry-pick', { hash });
    }

    try {
      await invoke<string>('cherry_pick_cmd', { hash, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] cherry-pick completed successfully', { hash });
      }
      await refreshAll();
      showToast('Cherry-pick realizado com sucesso!', 'success');
    } catch (error) {
      console.error('[Action] cherry-pick failed', { error });
      const errorMsg = getErrorMessage(error);

      if (errorMsg.includes('is a merge') || errorMsg.includes('-m option')) {
        showToast('Cherry-pick nao suportado: este e um merge commit', 'warning');
      } else {
        showToast('Falha no cherry-pick', 'error');
      }
      throw error;
    }
  };

  const revertCommit = async (hash: string) => {
    if (!repoPath || !isGitRepo) return;

    if (import.meta.env.DEV) {
      console.log('[Action] Starting revert', { hash });
    }

    try {
      await invoke<string>('revert_cmd', { hash, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] revert completed successfully', { hash });
      }
      await refreshAll();
      showToast('Revert realizado com sucesso!', 'success');
    } catch (error) {
      console.error('[Action] revert failed', { error });
      const errorMsg = getErrorMessage(error);

      if (errorMsg.includes('is a merge') || errorMsg.includes('-m option')) {
        showToast('Revert nao suportado: este e um merge commit', 'warning');
      } else {
        showToast('Falha no revert', 'error');
      }
      throw error;
    }
  };

  const checkoutCommit = async (hash: string) => {
    if (!repoPath || !isGitRepo) return;

    if (import.meta.env.DEV) {
      console.log('[Action] Starting checkout commit', { hash });
    }

    try {
      await invoke('checkout_commit_cmd', { hash, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] checkout commit completed successfully', { hash });
      }
      await refreshAll();
      showToast('Checkout para commit realizado (detached HEAD)', 'info');
    } catch (error) {
      console.error('[Action] checkout commit failed', { error });
      showToast('Falha no checkout', 'error');
      throw error;
    }
  };

  const createTag = async (name: string, hash: string, message?: string) => {
    if (!repoPath || !isGitRepo) return;

    if (import.meta.env.DEV) {
      console.log('[Action] Starting create tag', { name, hash, message });
    }

    try {
      await invoke('create_tag_cmd', { name, hash, message: message ?? null, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] create tag completed successfully', { name, hash });
      }
      await refreshAll();
      showToast(`Tag "${name}" criada com sucesso!`, 'success');
    } catch (error) {
      console.error('[Action] create tag failed', { error });
      showToast('Falha ao criar tag', 'error');
      throw error;
    }
  };

  const getCommitDiff = async (hash: string): Promise<string> => {
    if (!repoPath || !isGitRepo) return '';

    if (import.meta.env.DEV) {
      console.log('[Action] Starting getCommitDiff', { hash });
    }

    try {
      const diff = await invoke<string>('get_commit_diff_cmd', { hash, contextKey });
      if (import.meta.env.DEV) {
        console.log('[Action] getCommitDiff completed', { hash, size: diff.length });
      }
      return diff;
    } catch (error) {
      console.error('[Action] getCommitDiff failed', { error });
      throw error;
    }
  };

  const removeWorktree = async (worktreePath: string, force: boolean = false) => {
    if (!repoPath || !isGitRepo) return;

    try {
      await invoke('remove_worktree_cmd', { worktreePath, force, contextKey });
      await refreshWorktrees();
      await refreshBranches();
      showToast('Worktree removida com sucesso!', 'success');
    } catch (error) {
      console.error('Failed to remove worktree:', error);
      showToast('Falha ao remover worktree', 'error');
      throw error;
    }
  };

  const openInFinder = async (path: string) => {
    try {
      await invoke('open_in_finder_cmd', { path });
    } catch (error) {
      console.error('Failed to open in Finder:', error);
      showToast('Falha ao abrir no Finder', 'error');
      throw error;
    }
  };

  const openWorktreeInNewTab = async (worktreePath: string, worktreeBranch: string) => {
    try {
      const { createTab } = useTabStore.getState();
      const newTabId = createTab(worktreePath, worktreeBranch);
      const windowLabel = getWindowLabel();
      const result = await invoke<{ is_git: boolean }>('set_repository', {
        path: worktreePath,
        windowLabel,
        tabId: newTabId,
      });

      useTabStore.getState().updateTab(newTabId, {
        repoPath: worktreePath,
        repoState: result.is_git ? 'git' : 'no-git',
        title: worktreeBranch || worktreePath.split(/[\\/]/).pop() || 'Worktree',
      });
    } catch (error) {
      console.error('Failed to open worktree tab:', error);
      showToast('Falha ao abrir worktree', 'error');
      throw error;
    }
  };

  const selectFile = useCallback(
    (filePath: string | null) => {
      updateTabGit(tabId, { selectedFile: filePath });
    },
    [tabId, updateTabGit],
  );

  const setSelectedDiff = useCallback(
    (diff: string | null) => {
      updateTabGit(tabId, { selectedDiff: diff });
    },
    [tabId, updateTabGit],
  );

  const clearSelection = useCallback(() => {
    updateTabGit(tabId, { selectedFile: null, selectedDiff: null });
  }, [tabId, updateTabGit]);

  return useMemo(() => ({
    status: git?.status ?? null,
    branches: git?.branches ?? [],
    commits: git?.commits ?? [],
    worktrees: git?.worktrees ?? [],
    selectedFile: git?.selectedFile ?? null,
    selectedDiff: git?.selectedDiff ?? null,
    isLoading: git?.isLoading ?? false,

    refreshStatus,
    refreshBranches,
    refreshWorktrees,
    refreshCommits,
    refreshAll,
    stageFile,
    stageAll,
    unstageFile,
    commit,
    amendCommit,
    isLastCommitPushed,
    push,
    pull,
    checkoutBranch,
    checkoutRemoteBranch,
    createBranch,
    deleteBranch,
    mergePreview,
    mergeBranch,
    completeMerge,
    checkMergeInProgress,
    compareBranches,
    getFileDiff,
    getAllDiff,
    resetBranch,
    cherryPick,
    revertCommit,
    checkoutCommit,
    createTag,
    getCommitDiff,
    removeWorktree,
    openInFinder,
    openWorktreeInNewTab,
    selectFile,
    setSelectedDiff,
    clearSelection,
  }), [
    git?.status,
    git?.branches,
    git?.commits,
    git?.worktrees,
    git?.selectedFile,
    git?.selectedDiff,
    git?.isLoading,
    refreshStatus,
    refreshBranches,
    refreshWorktrees,
    refreshCommits,
    refreshAll,
    mergePreview,
    completeMerge,
    checkMergeInProgress,
    compareBranches,
    selectFile,
    setSelectedDiff,
    clearSelection,
  ]);
};
