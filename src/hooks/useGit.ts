import { invoke } from '@tauri-apps/api/core';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import type { RepoStatus, Branch, CommitInfo } from '../types';

export const useGit = () => {
  const { setStatus, setBranches, setCommits, setSelectedDiff } = useGitStore();
  const { repoPath } = useRepoStore();

  const refreshStatus = async () => {
    if (!repoPath) return;

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

    try {
      const commits = await invoke<CommitInfo[]>('get_commit_log', { limit });
      setCommits(commits);
    } catch (error) {
      console.error('Failed to get commits:', error);
      throw error;
    }
  };

  const stageFile = async (filePath: string) => {
    try {
      await invoke('stage_file_cmd', { filePath });
      await refreshStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
      throw error;
    }
  };

  const unstageFile = async (filePath: string) => {
    try {
      await invoke('unstage_file_cmd', { filePath });
      await refreshStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
      throw error;
    }
  };

  const commit = async (message: string) => {
    try {
      await invoke('commit_cmd', { message });
      await refreshStatus();
      await refreshCommits();
    } catch (error) {
      console.error('Failed to commit:', error);
      throw error;
    }
  };

  const push = async () => {
    try {
      const result = await invoke<string>('push_cmd');
      await refreshStatus();
      return result;
    } catch (error) {
      console.error('Failed to push:', error);
      throw error;
    }
  };

  const pull = async () => {
    try {
      const result = await invoke<string>('pull_cmd');
      await refreshStatus();
      await refreshCommits();
      return result;
    } catch (error) {
      console.error('Failed to pull:', error);
      throw error;
    }
  };

  const checkoutBranch = async (branchName: string) => {
    try {
      await invoke('checkout_branch_cmd', { branchName });
      await refreshStatus();
      await refreshBranches();
      await refreshCommits();
    } catch (error) {
      console.error('Failed to checkout branch:', error);
      throw error;
    }
  };

  const getFileDiff = async (filePath: string, staged: boolean) => {
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
    unstageFile,
    commit,
    push,
    pull,
    checkoutBranch,
    getFileDiff,
    getAllDiff,
  };
};
