import React from 'react';
import { useGitStore } from '@/stores/gitStore';
import { useRepoStore } from '@/stores/repoStore';
import { useToastStore } from '@/stores/toastStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useMergeStore } from '@/stores/mergeStore';
import { useGit } from '@/hooks/useGit';
import { useAi } from '@/hooks/useAi';
import { BranchesListPanel } from './components/BranchesListPanel';
import { MergePanel } from './components/MergePanel';
import { ConflictConfirmModal } from './components/ConflictConfirmModal';
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
  const { showToast } = useToastStore();
  const { setPage } = useNavigationStore();
  const { setMergeInProgress } = useMergeStore();
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
    completeMerge,
  } = useGit();

  const { analyzeMerge } = useAi();

  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [sourceBranch, setSourceBranch] = React.useState<string | null>(null);
  const [targetBranch, setTargetBranch] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isPushing, setIsPushing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = React.useState(false);
  const [mergeAnalysis, setMergeAnalysis] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);

  const currentBranch = status?.current_branch;
  const selected = branches.find((branch) => branch.name === selectedBranch) || null;

  React.useEffect(() => {
    if (!repoPath) return;
    refreshBranches().catch((error) => console.error('Failed to load branches', error));
  }, [repoPath]);

  useDefaultBranchSelection({ branches, selectedBranch, setSelectedBranch });
  useTargetBranchSync({ currentBranch, targetBranch, setTargetBranch });

  React.useEffect(() => {
    setMergeAnalysis(null);
    setIsAnalyzing(false);
  }, [sourceBranch, targetBranch]);

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

    setIsDeleteModalOpen(false);
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
    if (preview?.conflicts.length) {
      setIsConflictModalOpen(true);
      return;
    }
    setLoading(true);
    try {
      if (targetBranch !== currentBranch) {
        await checkoutBranch(targetBranch);
      }
      const result = await mergeBranch(sourceBranch);
      // Com --no-commit, precisamos finalizar o merge se não há conflitos
      if (result.conflicts.length === 0) {
        await completeMerge();
      }
      setMergeInProgress(false, 0);
      clearPreview();
      await refreshBranches();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMergeWithConflicts = async () => {
    if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) return;
    setIsConflictModalOpen(false);
    setLoading(true);

    try {
      if (targetBranch !== currentBranch) {
        await checkoutBranch(targetBranch);
      }

      const result = await mergeBranch(sourceBranch);
      if (result.conflicts.length > 0) {
        setMergeInProgress(true, result.conflicts.length);
        setPage('conflict-resolver');
        return;
      }

      await completeMerge();
      setMergeInProgress(false, 0);
      clearPreview();
      await refreshBranches();
    } catch (error) {
      console.error('Failed to start merge with conflicts:', error);
      showToast('Falha ao iniciar merge com conflitos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeMerge = async () => {
    if (!preview || !sourceBranch || !targetBranch) return;
    if (!preview.conflicts.length) return;

    setIsAnalyzing(true);
    try {
      const analysis = await analyzeMerge({
        sourceBranch,
        targetBranch,
        conflicts: preview.conflicts,
        filesChanged: preview.files_changed,
        insertions: preview.insertions,
        deletions: preview.deletions,
      });
      setMergeAnalysis(analysis);
    } catch (error) {
      console.error('Failed to analyze merge:', error);
      showToast('Falha ao analisar merge', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePush = async () => {
    if (isPushing || isPulling) return;
    setIsPushing(true);
    setLoading(true);
    try {
      await push();
    } catch (error) {
      console.error('Failed to push:', error);
    } finally {
      setLoading(false);
      setIsPushing(false);
    }
  };

  const handlePull = async () => {
    if (isPushing || isPulling) return;
    setIsPulling(true);
    setLoading(true);
    try {
      await pull();
    } catch (error) {
      console.error('Failed to pull:', error);
    } finally {
      setLoading(false);
      setIsPulling(false);
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
        isPushing={isPushing}
        isPulling={isPulling}
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
        onAnalyzeMerge={handleAnalyzeMerge}
        mergeAnalysis={mergeAnalysis}
        isAnalyzing={isAnalyzing}
        onSourceBranchChange={setSourceBranch}
        onTargetBranchChange={setTargetBranch}
        onMergeNow={handleMergeNow}
      />

      <ConflictConfirmModal
        isOpen={isConflictModalOpen}
        conflicts={preview?.conflicts ?? []}
        onClose={() => setIsConflictModalOpen(false)}
        onConfirm={handleConfirmMergeWithConflicts}
        isSubmitting={loading}
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
