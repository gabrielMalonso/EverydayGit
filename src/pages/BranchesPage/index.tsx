import React from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabMerge } from '@/hooks/useTabMerge';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabAi } from '@/hooks/useTabAi';
import { useTabRepo } from '@/hooks/useTabRepo';
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
import type { Branch, Worktree } from '@/types';

const normalizeBranchName = (name: string) => name.replace(/^\+ /, '');
const compareBranchName = (branch: Branch) => (branch.remote ? branch.name : normalizeBranchName(branch.name));

export const BranchesPage: React.FC = () => {
  const { t } = useTranslation('branches');
  const { branches, status, worktrees, refreshBranches, refreshWorktrees, fetchPrune, checkoutBranch, checkoutRemoteBranch, createBranch, deleteBranch, compareBranches, push, pull, removeWorktree, mergePreview, mergeBranch, completeMerge, openInFinder, openWorktreeInNewTab } = useTabGit();
  const { repoPath } = useTabRepo();
  const { setPage } = useTabNavigation();
  const { isMergeInProgress, setMergeInProgress } = useTabMerge();
  const { analyzeMerge } = useTabAi();

  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [sourceBranch, setSourceBranch] = React.useState<string | null>(null);
  const [targetBranch, setTargetBranch] = React.useState<string | null>(null);
  const [multiSelectedBranches, setMultiSelectedBranches] = React.useState<string[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = React.useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [isPushing, setIsPushing] = React.useState(false);
  const [isPulling, setIsPulling] = React.useState(false);
  const [isConflictModalOpen, setIsConflictModalOpen] = React.useState(false);
  const [mergeAnalysis, setMergeAnalysis] = React.useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [mergeCompleted, setMergeCompleted] = React.useState<{ source: string; target: string } | null>(null);

  const currentBranch = status?.current_branch;
  const selected = branches.find((branch) => compareBranchName(branch) === selectedBranch) || null;
  const selectedLocalBranches = React.useMemo(() => {
    if (multiSelectedBranches.length === 0) return [];
    const selectedSet = new Set(multiSelectedBranches);
    return branches.filter((branch) => !branch.remote && selectedSet.has(normalizeBranchName(branch.name)));
  }, [branches, multiSelectedBranches]);
  const isMultiSelectionMode = selectedLocalBranches.length > 1;

  const worktreeBranches = React.useMemo(
    () => new Set(worktrees.filter((worktree) => !worktree.is_main).map((worktree) => worktree.branch)),
    [worktrees],
  );
  const localBranchNames = React.useMemo(
    () => new Set(branches.filter((branch) => !branch.remote).map((branch) => normalizeBranchName(branch.name))),
    [branches],
  );

  React.useEffect(() => {
    if (!repoPath) return;
    refreshBranches().catch((error) => console.error('Failed to load branches', error));
    refreshWorktrees().catch((error) => console.error('Failed to load worktrees', error));
  }, [repoPath, refreshBranches, refreshWorktrees]);

  useDefaultBranchSelection({ branches, selectedBranch, setSelectedBranch });
  useTargetBranchSync({ currentBranch, targetBranch, setTargetBranch });

  React.useEffect(() => {
    setMergeAnalysis(null);
    setIsAnalyzing(false);
  }, [sourceBranch, targetBranch]);

  React.useEffect(() => {
    if (!selectedBranch) return;
    const selectedBranchData = branches.find((branch) => compareBranchName(branch) === selectedBranch);
    if (selectedBranchData?.current) {
      setSelectedBranch(null);
    }
  }, [branches, selectedBranch]);

  React.useEffect(() => {
    setMultiSelectedBranches((prev) =>
      prev.filter((name) => localBranchNames.has(name) && !worktreeBranches.has(name) && name !== currentBranch),
    );
  }, [localBranchNames, worktreeBranches, currentBranch]);

  React.useEffect(() => {
    if (multiSelectedBranches.length !== 1) return;
    if (selectedBranch === multiSelectedBranches[0]) return;
    setSelectedBranch(multiSelectedBranches[0]);
  }, [multiSelectedBranches, selectedBranch]);

  React.useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMultiSelectedBranches((prev) => (prev.length > 0 ? [] : prev));
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handleDismissMergeCompleted = () => {
    setMergeCompleted(null);
  };

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
  } = useBranchSearch(branches, searchQuery, worktreeBranches);

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
    if (isMergeInProgress) {
      toast.warning(t('toast.createBranchBlocked'));
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const baseRef = source.trim() || currentBranch || undefined;
    setLoading(true);
    try {
      await createBranch(trimmedName, baseRef, pushToRemote);
      setMultiSelectedBranches([]);
      setSelectedBranch(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectBranch = (branchName: string, isRemote: boolean, toggleMulti: boolean) => {
    if (!isRemote && branchName === currentBranch) return;

    if (isRemote || !toggleMulti) {
      setMultiSelectedBranches([]);
      setSelectedBranch(branchName);
      return;
    }

    if (worktreeBranches.has(branchName)) return;

    setMultiSelectedBranches((prev) => {
      const baseSelection =
        prev.length > 0
          ? new Set(prev)
          : selectedBranch && !(selected?.remote ?? false) && selectedBranch !== currentBranch
            ? new Set([selectedBranch])
            : new Set<string>();

      if (baseSelection.has(branchName)) {
        baseSelection.delete(branchName);
      } else {
        baseSelection.add(branchName);
      }

      return Array.from(baseSelection);
    });
  };

  const handleDeleteBranch = () => {
    if (isMergeInProgress) {
      toast.warning(t('toast.removeBranchBlocked'));
      return;
    }
    if (isMultiSelectionMode) {
      setIsDeleteModalOpen(true);
      return;
    }
    if (!selectedBranch || !selected || selected.current) return;
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async (deleteCorresponding: boolean) => {
    setLoading(true);

    try {
      if (isMultiSelectionMode) {
        const targets = selectedLocalBranches
          .map((branch) => normalizeBranchName(branch.name))
          .filter((name) => name !== currentBranch && !worktreeBranches.has(name));
        const existingRemoteRefs = new Set(
          branches.filter((branch) => branch.remote).map((branch) => branch.name),
        );

        let localRemoved = 0;
        let remoteRemoved = 0;
        let failed = 0;

        for (const branchName of targets) {
          try {
            await deleteBranch(branchName, false, false, { silent: true });
            localRemoved += 1;
          } catch {
            failed += 1;
            continue;
          }

          if (!deleteCorresponding || !existingRemoteRefs.has(`origin/${branchName}`)) continue;

          try {
            await deleteBranch(`origin/${branchName}`, false, true, { silent: true });
            remoteRemoved += 1;
          } catch {
            failed += 1;
          }
        }

        if (failed === 0) {
          toast.success(t('toast.multiDeleteSuccess', { local: localRemoved, remote: remoteRemoved }));
        } else {
          toast.warning(t('toast.multiDeletePartial', { local: localRemoved, remote: remoteRemoved, failed }));
        }
      } else if (selectedBranch && selected) {
        await deleteBranch(selectedBranch, false, selected.remote);

        if (deleteCorresponding) {
          if (selected.remote) {
            const localName = selectedBranch.replace(/^[^/]+\//, '');
            await deleteBranch(localName, false, false);
          } else {
            await deleteBranch(`origin/${selectedBranch}`, false, true);
          }
        }
      }

      setMultiSelectedBranches([]);
      setSelectedBranch(null);
      await refreshBranches();
    } finally {
      setLoading(false);
    }

    setIsDeleteModalOpen(false);
  };

  const handleCheckout = async (branchName: string, isRemote: boolean) => {
    if (isMergeInProgress) {
      toast.warning(t('toast.checkoutBlocked'));
      return;
    }
    setLoading(true);
    try {
      if (isRemote) {
        await checkoutRemoteBranch(branchName);
      } else {
        await checkoutBranch(branchName);
      }
      setMultiSelectedBranches([]);
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
    // Save branch names before clearing
    const mergedSource = sourceBranch;
    const mergedTarget = targetBranch;

    setLoading(true);
    try {
      if (targetBranch !== currentBranch) {
        await checkoutBranch(targetBranch);
      }
      const result = await mergeBranch(sourceBranch);
      if (result.conflicts.length === 0) {
        // completeMerge may fail if merge was auto-completed (fast-forward)
        // This is expected behavior, so we catch and ignore this specific error
        try {
          await completeMerge();
        } catch {
          // Merge already completed (e.g., fast-forward), continue normally
        }
      }
      setMergeInProgress(false, 0);
      clearPreview();
      await refreshBranches();

      // Show merge completed feedback
      setSourceBranch(null);
      setTargetBranch(null);
      setMergeCompleted({ source: mergedSource, target: mergedTarget });
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
      toast.error(t('toast.mergeWithConflictsFailed'));
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
      toast.error(t('toast.analyzeMergeFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePush = async () => {
    if (isMergeInProgress) {
      toast.warning(t('toast.pushBlocked'));
      return;
    }
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
    if (isMergeInProgress) {
      toast.warning(t('toast.pullBlocked'));
      return;
    }
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

  const handleOpenWorktree = async (worktree: Worktree) => {
    try {
      await openWorktreeInNewTab(worktree.path, worktree.branch);
    } catch (error) {
      console.error('Failed to open worktree tab:', error);
    }
  };

  const handleOpenWorktreeInFinder = (path: string) => {
    openInFinder(path).catch((error) => {
      console.error('Failed to open worktree in Finder:', error);
    });
  };

  const handleRemoveWorktree = async (path: string) => {
    try {
      await removeWorktree(path);
      await refreshWorktrees();
      await refreshBranches();
    } catch (error) {
      console.error('Failed to remove worktree:', error);
    }
  };

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <BranchesListPanel
        filteredLocalBranches={filteredLocalBranches}
        filteredRemoteBranches={filteredRemoteBranches}
        worktrees={worktrees}
        worktreeBranches={worktreeBranches}
        selectedBranch={selectedBranch}
        multiSelectedBranches={new Set(multiSelectedBranches)}
        multiSelectionCount={selectedLocalBranches.length}
        isMultiSelectionMode={isMultiSelectionMode}
        selected={selected}
        searchQuery={searchQuery}
        hasSearchQuery={hasSearchQuery}
        loading={loading}
        isPushing={isPushing}
        isPulling={isPulling}
        isMergeInProgress={isMergeInProgress}
        ahead={status?.ahead ?? 0}
        behind={status?.behind ?? 0}
        onSearchQueryChange={setSearchQuery}
        onSelectBranch={handleSelectBranch}
        onCheckout={handleCheckout}
        onDeleteBranch={handleDeleteBranch}
        onOpenNewBranchModal={() => setIsNewBranchModalOpen(true)}
        onRefresh={async () => {
          await fetchPrune();
          refreshBranches();
          refreshWorktrees();
        }}
        onPush={handlePush}
        onPull={handlePull}
        onOpenWorktree={handleOpenWorktree}
        onOpenWorktreeInFinder={handleOpenWorktreeInFinder}
        onRemoveWorktree={handleRemoveWorktree}
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
        isMergeInProgress={isMergeInProgress}
        mergeCompleted={mergeCompleted}
        onAnalyzeMerge={handleAnalyzeMerge}
        mergeAnalysis={mergeAnalysis}
        isAnalyzing={isAnalyzing}
        onSourceBranchChange={setSourceBranch}
        onTargetBranchChange={setTargetBranch}
        onMergeNow={handleMergeNow}
        onDismissMergeCompleted={handleDismissMergeCompleted}
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
        branch={isMultiSelectionMode ? null : selected}
        selectedBranches={isMultiSelectionMode ? selectedLocalBranches : []}
        branches={branches}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};
