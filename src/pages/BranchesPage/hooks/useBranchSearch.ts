import type { Branch } from '@/types';

type BranchOption = {
  value: string;
  label: string;
};

export const useBranchSearch = (
  branches: Branch[],
  searchQuery: string,
  worktreeBranches: Set<string>,
) => {
  const normalizeName = (name: string) => name.replace(/^\+ /, '');
  const localBranches = branches.filter((branch) => !branch.remote);
  const remoteBranches = branches.filter((branch) => branch.remote);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;

  const filteredLocalBranches = hasSearchQuery
    ? localBranches.filter((branch) => normalizeName(branch.name).toLowerCase().includes(normalizedQuery))
    : localBranches;
  const filteredRemoteBranches = hasSearchQuery
    ? remoteBranches.filter((branch) => normalizeName(branch.name).toLowerCase().includes(normalizedQuery))
    : remoteBranches;

  const formatBranchLabel = (branch: Branch) => {
    const tags: string[] = [];
    const normalizedName = normalizeName(branch.name);
    if (branch.current) tags.push('atual');
    if (branch.remote) tags.push('remota');
    if (worktreeBranches.has(normalizedName)) tags.push('worktree');
    return tags.length ? `${normalizedName} (${tags.join(', ')})` : normalizedName;
  };

  const branchOptions: BranchOption[] = [...localBranches, ...remoteBranches].map((branch) => ({
    value: normalizeName(branch.name),
    label: formatBranchLabel(branch),
  }));
  const localBranchOptions: BranchOption[] = localBranches.map((branch) => ({
    value: normalizeName(branch.name),
    label: formatBranchLabel(branch),
  }));

  return {
    filteredLocalBranches,
    filteredRemoteBranches,
    branchOptions,
    localBranchOptions,
    hasSearchQuery,
  };
};
