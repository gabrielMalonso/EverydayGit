import { invoke } from '@tauri-apps/api/core';
import { useGitStore } from '../stores/gitStore';
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
import { demoBranches, demoCommits, demoDiffByFile, demoStatus } from '../demo/fixtures';

export const useGit = () => {
  const { setStatus, setBranches, setCommits, setSelectedDiff } = useGitStore();
  const { repoPath } = useRepoStore();
  const { showToast } = useToastStore();

  const refreshStatus = async () => {
    if (!repoPath) return;

    if (isDemoMode()) {
      if (!useGitStore.getState().status) {
        setStatus(demoStatus);
      }
      return;
    }

    try {
      const status = await invoke<RepoStatus>('get_git_status');
      setStatus(status);
    } catch (error) {
      console.error('Failed to get git status:', error);
      throw error;
    }
  };

  const refreshBranches = async () => {
    if (!repoPath) return;

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
    if (!repoPath) return;

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

  const stageFile = async (filePath: string) => {
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
      console.error('Failed to stage file:', error);
      throw error;
    }
  };

  const stageAll = async () => {
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
      console.error('Failed to stage all files:', error);
      throw error;
    }
  };

  const unstageFile = async (filePath: string) => {
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

  const push = async () => {
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

  const createBranch = async (name: string, from?: string) => {
    if (isDemoMode()) {
      const currentBranches = useGitStore.getState().branches;
      const nextBranches = currentBranches.map((b) => ({ ...b, current: false }));
      nextBranches.push({ name, current: true, remote: false });
      setBranches(nextBranches);
      const status = useGitStore.getState().status;
      if (status) {
        setStatus({ ...status, current_branch: name });
      }
      await refreshCommits();
      return;
    }

    try {
      await invoke('create_branch_cmd', { name, from });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      showToast(`Branch "${name}" criada`, 'success');
    } catch (error) {
      console.error('Failed to create branch:', error);
      showToast('Falha ao criar branch', 'error');
      throw error;
    }
  };

  const deleteBranch = async (name: string, force = false) => {
    if (isDemoMode()) {
      const currentBranches = useGitStore.getState().branches;
      const nextBranches = currentBranches.filter((b) => b.name !== name);
      setBranches(nextBranches);
      return;
    }

    try {
      await invoke('delete_branch_cmd', { name, force });
      await refreshBranches();
      await refreshStatus();
      showToast(`Branch "${name}" removida`, 'success');
    } catch (error) {
      console.error('Failed to delete branch:', error);
      showToast('Falha ao remover branch', 'error');
      throw error;
    }
  };

  const mergePreview = async (source: string, target?: string) => {
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

    try {
      const preview = await invoke<MergePreview>('merge_preview_cmd', { source, target });
      return preview;
    } catch (error) {
      console.error('Failed to preview merge:', error);
      throw error;
    }
  };

  const mergeBranch = async (source: string, message?: string) => {
    if (isDemoMode()) {
      const result: MergeResult = {
        fast_forward: false,
        summary: `Merged ${source} into current (demo)`,
        conflicts: [],
      };
      return result;
    }

    try {
      const result = await invoke<MergeResult>('merge_branch_cmd', { source, message });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
      showToast(`Merge de "${source}" concluído`, 'success');
      return result;
    } catch (error) {
      console.error('Failed to merge branch:', error);
      showToast('Falha no merge', 'error');
      throw error;
    }
  };

  const compareBranches = async (base: string, compare: string) => {
    if (isDemoMode()) {
      const comparison: BranchComparison = {
        ahead: 2,
        behind: 1,
        commits: demoCommits.slice(0, 5),
        diff_summary: 'Demo diff summary',
      };
      return comparison;
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
  };

  const getFileDiff = async (filePath: string, staged: boolean) => {
    if (isDemoMode()) {
      const entry = demoDiffByFile[filePath];
      const preferred = staged ? entry?.staged : entry?.unstaged;
      const fallback = staged ? entry?.unstaged : entry?.staged;
      const diff = preferred && preferred.trim() ? preferred : fallback ?? '';
      setSelectedDiff(diff);
      return diff;
    }

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

    try {
      const diff = await invoke<string>('get_all_diff_cmd', { staged });
      return diff;
    } catch (error) {
      console.error('Failed to get all diff:', error);
      throw error;
    }
  };

  return {
    refreshStatus,
    refreshBranches,
    refreshCommits,
    stageFile,
    stageAll,
    unstageFile,
    commit,
    push,
    pull,
    checkoutBranch,
    checkoutRemoteBranch,
    createBranch,
    deleteBranch,
    mergePreview,
    mergeBranch,
    compareBranches,
    getFileDiff,
    getAllDiff,
  };
};
