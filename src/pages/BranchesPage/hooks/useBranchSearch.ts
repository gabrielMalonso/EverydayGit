import type { Branch } from '@/types';

type BranchOption = {
  value: string;
  label: string;
};

export const useBranchSearch = (branches: Branch[], searchQuery: string) => {
  const localBranches = branches.filter((branch) => !branch.remote);
  const remoteBranches = branches.filter((branch) => branch.remote);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const hasSearchQuery = normalizedQuery.length > 0;

  const filteredLocalBranches = hasSearchQuery
    ? localBranches.filter((branch) => branch.name.toLowerCase().includes(normalizedQuery))
    : localBranches;
  const filteredRemoteBranches = hasSearchQuery
    ? remoteBranches.filter((branch) => branch.name.toLowerCase().includes(normalizedQuery))
    : remoteBranches;

  const formatBranchLabel = (branch: Branch) => {
    const tags: string[] = [];
    if (branch.current) tags.push('atual');
    if (branch.remote) tags.push('remota');
    return tags.length ? `${branch.name} (${tags.join(', ')})` : branch.name;
  };

  const branchOptions: BranchOption[] = [...localBranches, ...remoteBranches].map((branch) => ({
    value: branch.name,
    label: formatBranchLabel(branch),
  }));
  const localBranchOptions: BranchOption[] = localBranches.map((branch) => ({
    value: branch.name,
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
