import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useGitStore } from '../stores/gitStore';
import { useMergeStore } from '../stores/mergeStore';
import { useRepoStore } from '../stores/repoStore';
import { useToastStore } from '../stores/toastStore';
import type {
  RepoStatus,
  Branch,
  CommitInfo,
  BranchComparison,
  MergePreview,
  MergeResult,
} from '../types';
import { isDemoMode } from '../demo/demoMode';
import { demoBranches, demoCommits, demoConflictFiles, demoDiffByFile, demoStatus } from '../demo/fixtures';

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

export const useGit = () => {
  const { setStatus, setBranches, setCommits, setSelectedDiff, setSelectedFile } = useGitStore();
  const { repoPath, repoState } = useRepoStore();
  const { showToast } = useToastStore();
  const isGitRepo = repoState === 'git';

  const refreshStatus = async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      if (!useGitStore.getState().status) {
        setStatus(demoStatus);
      }
      return;
    }

    try {
      const status = await invoke<RepoStatus>('get_git_status');
      setStatus(status);
      const [inProgress, conflicts] = await invoke<[boolean, string[]]>('is_merge_in_progress_cmd');
      useMergeStore.getState().setMergeInProgress(inProgress, conflicts.length);
    } catch (error) {
      console.error('Failed to get git status:', error);
      throw error;
    }
  };

  const refreshBranches = async () => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      setBranches(demoBranches);
      return;
    }

    try {
      const branches = await invoke<Branch[]>('get_branches_cmd');
      setBranches(branches);
    } catch (error) {
      console.error('Failed to get branches:', error);
      throw error;
    }
  };

  const refreshCommits = async (limit: number = 50) => {
    if (!repoPath || !isGitRepo) return;

    if (isDemoMode()) {
      setCommits(demoCommits.slice(0, limit));
      return;
    }

    try {
      const commits = await invoke<CommitInfo[]>('get_commit_log', { limit });
      setCommits(commits);
    } catch (error) {
      console.error('Failed to get commits:', error);
      throw error;
    }
  };

  const refreshAll = async (commitsLimit: number = 50) => {
    if (!repoPath || !isGitRepo) return;

    await Promise.all([refreshStatus(), refreshBranches(), refreshCommits(commitsLimit)]);

    const { status, selectedFile } = useGitStore.getState();
    if (selectedFile && !status?.files.some((file) => file.path === selectedFile)) {
      setSelectedFile(null);
      setSelectedDiff(null);
    }
  };

  const stageFile = async (filePath: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const current = useGitStore.getState().status;
      if (!current) return;
      const nextFiles = current.files.map((file) => (file.path === filePath ? { ...file, staged: true } : file));
      setStatus({ ...current, files: nextFiles });
      return;
    }

    try {
      await invoke('stage_file_cmd', { filePath });
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
      const current = useGitStore.getState().status;
      if (!current) return;
      const nextFiles = current.files.map((file) => {
        if (file.staged) return file;
        const nextStatus = file.status === 'Untracked' ? 'Added' : file.status;
        return { ...file, staged: true, status: nextStatus };
      });
      setStatus({ ...current, files: nextFiles });
      return;
    }

    try {
      await invoke('stage_all_cmd');
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
      const current = useGitStore.getState().status;
      if (!current) return;
      const nextFiles = current.files.map((file) => (file.path === filePath ? { ...file, staged: false } : file));
      setStatus({ ...current, files: nextFiles });
      return;
    }

    try {
      await invoke('unstage_file_cmd', { filePath });
      await refreshStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
      throw error;
    }
  };

  const commit = async (message: string) => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentStatus = useGitStore.getState().status;
      if (!currentStatus) return;

      const stagedFiles = currentStatus.files.filter((file) => file.staged);
      const remainingFiles = currentStatus.files.filter((file) => !file.staged);

      const newCommit: CommitInfo = {
        hash: Math.random().toString(16).slice(2).padEnd(40, '0').slice(0, 40),
        message,
        author: 'demo-user',
        date: new Date().toISOString(),
      };

      const currentCommits = useGitStore.getState().commits;
      setCommits([newCommit, ...currentCommits]);
      setStatus({ ...currentStatus, files: remainingFiles, ahead: currentStatus.ahead + 1 });

      // Clear diff for staged files (simplified)
      if (stagedFiles.some((f) => f.path === useGitStore.getState().selectedFile)) {
        setSelectedDiff('');
      }
      return;
    }

    try {
      await invoke('commit_cmd', { message });
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
      const currentStatus = useGitStore.getState().status;
      if (!currentStatus) return;

      const currentCommits = useGitStore.getState().commits;
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

      setCommits([amendedCommit, ...currentCommits.slice(1)]);
      setStatus({ ...currentStatus, files: remainingFiles });

      if (stagedFiles.some((f) => f.path === useGitStore.getState().selectedFile)) {
        setSelectedDiff('');
      }

      showToast('Amend realizado! (demo)', 'success');
      return;
    }

    try {
      await invoke('amend_commit_cmd', { message });
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
      return await invoke<boolean>('is_last_commit_pushed_cmd');
    } catch (error) {
      console.error('Failed to check if last commit was pushed:', error);
      return false;
    }
  };

  const push = async () => {
    if (!repoPath || (!isGitRepo && !isDemoMode())) return '';
    if (isDemoMode()) {
      const current = useGitStore.getState().status;
      if (!current) return 'Demo: nothing to push';
      const nextAhead = Math.max(0, current.ahead - 1);
      setStatus({ ...current, ahead: nextAhead });
      return 'Demo: pushed successfully';
    }

    try {
      const result = await invoke<string>('push_cmd');
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
      const current = useGitStore.getState().status;
      if (!current) return 'Demo: nothing to pull';
      setStatus({ ...current, behind: 0 });
      return 'Demo: pulled successfully';
    }

    try {
      const result = await invoke<string>('pull_cmd');
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
      const currentBranches = useGitStore.getState().branches;
      const nextBranches = currentBranches.map((branch) => ({
        ...branch,
        current: !branch.remote && branch.name === branchName,
      }));
      setBranches(nextBranches);
      const current = useGitStore.getState().status;
      if (current) setStatus({ ...current, current_branch: branchName });
      await refreshCommits();
      return;
    }

    try {
      await invoke('checkout_branch_cmd', { branchName });
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
    // Deriva nome local: "origin/feature/x" → "feature/x"
    const localName = remoteRef.replace(/^[^/]+\//, '');

    if (!repoPath || (!isGitRepo && !isDemoMode())) return;
    if (isDemoMode()) {
      const currentBranches = useGitStore.getState().branches;

      // Adiciona nova branch local
      const newBranch: Branch = {
        name: localName,
        current: true,
        remote: false,
      };

      // Atualiza branches (remove current das outras, adiciona nova)
      const updatedBranches = currentBranches.map((b) => ({
        ...b,
        current: false,
      }));
      updatedBranches.push(newBranch);

      setBranches(updatedBranches);

      // Atualiza status
      const current = useGitStore.getState().status;
      if (current) {
        setStatus({ ...current, current_branch: localName });
      }

      await refreshCommits();
      return;
    }

    try {
      await invoke('checkout_remote_branch_cmd', { remoteRef });
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
      const currentBranches = useGitStore.getState().branches;
      const nextBranches = currentBranches.map((b) => ({ ...b, current: checkout ? false : b.current }));
      nextBranches.push({ name, current: checkout, remote: false });
      setBranches(nextBranches);
      if (checkout) {
        const status = useGitStore.getState().status;
        if (status) {
          setStatus({ ...status, current_branch: name });
        }
      }
      await refreshCommits();
      return;
    }

    console.log('[Action] Starting createBranch', { name, from, pushToRemote, checkout });

    try {
      await invoke('create_branch_cmd', { name, from: from ?? null, pushToRemote, checkout });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      console.log('[Action] createBranch completed successfully', { name });
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
      const currentBranches = useGitStore.getState().branches;
      const nextBranches = currentBranches.filter((b) => b.name !== name);
      setBranches(nextBranches);
      return;
    }

    try {
      await invoke('delete_branch_cmd', { name, force, isRemote });
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
        setSelectedDiff('');
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
        const preview = await invoke<MergePreview>('merge_preview_cmd', { source, target });
        return preview;
      } catch (error) {
        console.error('Failed to preview merge:', error);
        throw error;
      }
    },
    [repoPath, isGitRepo, setSelectedDiff],
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
      const result = await invoke<MergeResult>('merge_branch_cmd', { source, message });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      if (result.conflicts.length > 0) {
        showToast(`Merge iniciado com ${result.conflicts.length} conflito(s)`, 'warning');
      }
      // Toast de sucesso será mostrado após completeMerge()
      return result;
    } catch (error) {
      console.error('Failed to merge branch:', error);
      showToast('Falha no merge', 'error');
      throw error;
    }
  };

  const checkMergeInProgress = useCallback(async () => {
    if ((!repoPath || !isGitRepo) && !isDemoMode()) {
      return { inProgress: false, conflicts: [] as string[] };
    }

    if (isDemoMode()) {
      return {
        inProgress: demoConflictFiles.length > 0,
        conflicts: demoConflictFiles,
      };
    }

    try {
      const [inProgress, conflicts] = await invoke<[boolean, string[]]>('is_merge_in_progress_cmd');
      return { inProgress, conflicts };
    } catch (error) {
      console.error('Failed to check merge status:', error);
      throw error;
    }
  }, [repoPath, isGitRepo]);

  const completeMerge = useCallback(async (message?: string) => {
    if (isDemoMode()) {
      showToast('Merge concluído com sucesso!', 'success');
      return 'Demo: merge completed.';
    }

    if (!repoPath || !isGitRepo) return '';

    try {
      const result = await invoke<string>('complete_merge_cmd', { message });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      showToast('Merge concluído com sucesso!', 'success');
      return result;
    } catch (error) {
      console.error('Failed to complete merge:', error);
      throw error;
    }
  }, [repoPath, isGitRepo, showToast]);

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
        });
        return comparison;
      } catch (error) {
        console.error('Failed to compare branches:', error);
        throw error;
      }
    },
    [repoPath, isGitRepo],
  );

  const getFileDiff = async (filePath: string, staged: boolean) => {
    if (isDemoMode()) {
      const entry = demoDiffByFile[filePath];
      const preferred = staged ? entry?.staged : entry?.unstaged;
      const fallback = staged ? entry?.unstaged : entry?.staged;
      const diff = preferred && preferred.trim() ? preferred : fallback ?? '';
      setSelectedDiff(diff);
      return diff;
    }

    if (!repoPath || !isGitRepo) return '';

    try {
      const diff = await invoke<string>('get_file_diff', { filePath, staged });
      setSelectedDiff(diff);
      return diff;
    } catch (error) {
      console.error('Failed to get file diff:', error);
      throw error;
    }
  };

  const getAllDiff = async (staged: boolean) => {
    if (isDemoMode()) {
      const current = useGitStore.getState().status;
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
      const diff = await invoke<string>('get_all_diff_cmd', { staged });
      return diff;
    } catch (error) {
      console.error('Failed to get all diff:', error);
      throw error;
    }
  };

  // ============================================================================
  // Context Menu Actions
  // ============================================================================

  const resetBranch = async (hash: string, mode: 'soft' | 'mixed' | 'hard' | 'keep') => {
    if (!repoPath || !isGitRepo) return;

    console.log('[Action] Starting reset', { hash, mode });

    try {
      await invoke('reset_cmd', { hash, mode });
      console.log('[Action] reset completed successfully', { hash, mode });
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

    console.log('[Action] Starting cherry-pick', { hash });

    try {
      await invoke<string>('cherry_pick_cmd', { hash });
      console.log('[Action] cherry-pick completed successfully', { hash });
      await refreshAll();
      showToast('Cherry-pick realizado com sucesso!', 'success');
    } catch (error) {
      console.error('[Action] cherry-pick failed', { error });
      const errorMsg = getErrorMessage(error);

      // Detect merge commit error
      if (errorMsg.includes('is a merge') || errorMsg.includes('-m option')) {
        showToast('Cherry-pick não suportado: este é um merge commit', 'warning');
      } else {
        showToast('Falha no cherry-pick', 'error');
      }
      throw error;
    }
  };

  const revertCommit = async (hash: string) => {
    if (!repoPath || !isGitRepo) return;

    console.log('[Action] Starting revert', { hash });

    try {
      await invoke<string>('revert_cmd', { hash });
      console.log('[Action] revert completed successfully', { hash });
      await refreshAll();
      showToast('Revert realizado com sucesso!', 'success');
    } catch (error) {
      console.error('[Action] revert failed', { error });
      const errorMsg = getErrorMessage(error);

      // Detect merge commit error
      if (errorMsg.includes('is a merge') || errorMsg.includes('-m option')) {
        showToast('Revert não suportado: este é um merge commit', 'warning');
      } else {
        showToast('Falha no revert', 'error');
      }
      throw error;
    }
  };

  const checkoutCommit = async (hash: string) => {
    if (!repoPath || !isGitRepo) return;

    console.log('[Action] Starting checkout commit', { hash });

    try {
      await invoke('checkout_commit_cmd', { hash });
      console.log('[Action] checkout commit completed successfully', { hash });
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

    console.log('[Action] Starting create tag', { name, hash, message });

    try {
      await invoke('create_tag_cmd', { name, hash, message: message ?? null });
      console.log('[Action] create tag completed successfully', { name, hash });
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

    console.log('[Action] Starting getCommitDiff', { hash });

    try {
      const diff = await invoke<string>('get_commit_diff_cmd', { hash });
      console.log('[Action] getCommitDiff completed', { hash, size: diff.length });
      return diff;
    } catch (error) {
      console.error('[Action] getCommitDiff failed', { error });
      throw error;
    }
  };

  return {
    refreshStatus,
    refreshBranches,
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
    // Context Menu Actions
    resetBranch,
    cherryPick,
    revertCommit,
    checkoutCommit,
    createTag,
    getCommitDiff,
  };
};
