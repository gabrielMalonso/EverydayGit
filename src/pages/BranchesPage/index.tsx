import React from 'react';
import { useGitStore } from '@/stores/gitStore';
import { useRepoStore } from '@/stores/repoStore';
import { useGit } from '@/hooks/useGit';
import { BranchesListPanel } from './components/BranchesListPanel';
import { MergePanel } from './components/MergePanel';
import { NewBranchModal } from './components/NewBranchModal';
import { DeleteBranchModal } from './components/DeleteBranchModal';
import { useBranchSearch } from './hooks/useBranchSearch';
import { useDefaultBranchSelection } from './hooks/useDefaultBranchSelection';
import { useMergeMetrics } from './hooks/useMergeMetrics';
import { useMergePreview } from './hooks/useMergePreview';
import { useTargetBranchSync } from './hooks/useTargetBranchSync';

export const BranchesPage: React.FC = () => {
  const { branches, status } = useGitStore();
  const { repoPath } = useRepoStore();
  const {
    refreshBranches,
    checkoutBranch,
    checkoutRemoteBranch,
    createBranch,
    deleteBranch,
    compareBranches,
    push,
    pull,
    mergePreview,
    mergeBranch,
  } = useGit();

  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [sourceBranch, setSourceBranch] = React.useState<string | null>(null);
  const [targetBranch, setTargetBranch] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const currentBranch = status?.current_branch;
  const selected = branches.find((branch) => branch.name === selectedBranch) || null;

  React.useEffect(() => {
    if (!repoPath) return;
    refreshBranches().catch((error) => console.error('Failed to load branches', error));
  }, [repoPath]);

  useDefaultBranchSelection({ branches, selectedBranch, setSelectedBranch });
  useTargetBranchSync({ currentBranch, targetBranch, setTargetBranch });

  const { comparison, preview, clearPreview } = useMergePreview({
    sourceBranch,
    targetBranch,
    compareBranches,
    mergePreview,
    setLoading,
  });

  const {
    filteredLocalBranches,
    filteredRemoteBranches,
    branchOptions,
    localBranchOptions,
    hasSearchQuery,
  } = useBranchSearch(branches, searchQuery);

  const {
    isSameBranch,
    isTargetNotCurrent,
    hasNoCommits,
    hasConflicts,
    aheadLabel,
    behindLabel,
    filesChangedLabel,
    insertionsLabel,
    deletionsLabel,
    conflictsLabel,
    mergeDisabled,
  } = useMergeMetrics({
    sourceBranch,
    targetBranch,
    currentBranch,
    comparison,
    preview,
    loading,
  });

  const handleCreateBranch = async (name: string, source: string, pushToRemote: boolean) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const baseRef = source.trim() || currentBranch || undefined;
    setLoading(true);
    try {
      await createBranch(trimmedName, baseRef, pushToRemote);
      setSelectedBranch(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = () => {
    if (!selectedBranch || !selected || selected.current) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (deleteCorresponding: boolean) => {
    if (!selectedBranch || !selected) return;
    setIsDeleteModalOpen(false);
    setLoading(true);

    try {
      await deleteBranch(selectedBranch, false, selected.remote);

      if (deleteCorresponding) {
        if (selected.remote) {
          const localName = selectedBranch.replace(/^[^/]+\//, '');
          await deleteBranch(localName, false, false);
        } else {
          await deleteBranch(`origin/${selectedBranch}`, false, true);
        }
      }

      setSelectedBranch(null);
      await refreshBranches();
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (branchName: string, isRemote: boolean) => {
    setLoading(true);
    try {
      if (isRemote) {
        await checkoutRemoteBranch(branchName);
      } else {
        await checkoutBranch(branchName);
      }
      setSelectedBranch(branchName);
    } finally {
      setLoading(false);
    }
  };

  const handleMergeNow = async () => {
    if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) return;
    if (comparison && comparison.ahead === 0) return;
    if (preview?.conflicts.length) return;
    setLoading(true);
    try {
      if (targetBranch !== currentBranch) {
        await checkoutBranch(targetBranch);
      }
      await mergeBranch(sourceBranch);
      clearPreview();
      await refreshBranches();
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    setLoading(true);
    try {
      await push();
    } catch (error) {
      console.error('Failed to push:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    setLoading(true);
    try {
      await pull();
    } catch (error) {
      console.error('Failed to pull:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <BranchesListPanel
        filteredLocalBranches={filteredLocalBranches}
        filteredRemoteBranches={filteredRemoteBranches}
        selectedBranch={selectedBranch}
        selected={selected}
        searchQuery={searchQuery}
        hasSearchQuery={hasSearchQuery}
        loading={loading}
        onSearchQueryChange={setSearchQuery}
        onSelectBranch={setSelectedBranch}
        onCheckout={handleCheckout}
        onDeleteBranch={handleDeleteBranch}
        onOpenNewBranchModal={() => setIsNewBranchModalOpen(true)}
        onRefresh={() => refreshBranches()}
        onPush={handlePush}
        onPull={handlePull}
      />

      <MergePanel
        sourceBranch={sourceBranch}
        targetBranch={targetBranch}
        branchOptions={branchOptions}
        localBranchOptions={localBranchOptions}
        comparison={comparison}
        preview={preview}
        isSameBranch={isSameBranch}
        isTargetNotCurrent={isTargetNotCurrent}
        hasNoCommits={hasNoCommits}
        hasConflicts={hasConflicts}
        aheadLabel={aheadLabel}
        behindLabel={behindLabel}
        filesChangedLabel={filesChangedLabel}
        insertionsLabel={insertionsLabel}
        deletionsLabel={deletionsLabel}
        conflictsLabel={conflictsLabel}
        mergeDisabled={mergeDisabled}
        onSourceBranchChange={setSourceBranch}
        onTargetBranchChange={setTargetBranch}
        onMergeNow={handleMergeNow}
      />

      <NewBranchModal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        branches={branches}
        currentBranch={currentBranch ?? null}
        onCreateBranch={handleCreateBranch}
      />

      <DeleteBranchModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        branch={selected}
        branches={branches}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
