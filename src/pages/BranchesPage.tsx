import React from 'react';
import { Panel } from '@/components/Panel';
import { Button, Input, SelectMenu } from '@/ui';
import { NewBranchModal } from '@/components/NewBranchModal';
import { useGitStore } from '@/stores/gitStore';
import { useRepoStore } from '@/stores/repoStore';
import { useGit } from '@/hooks/useGit';
import type { Branch, BranchComparison, MergePreview } from '@/types';
import { ArrowRight, Check, GitMerge, Plus, RefreshCw, Search } from 'lucide-react';

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
    mergePreview,
    mergeBranch,
  } = useGit();

  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [sourceBranch, setSourceBranch] = React.useState<string | null>(null);
  const [targetBranch, setTargetBranch] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isNewBranchModalOpen, setIsNewBranchModalOpen] = React.useState(false);
  const [comparison, setComparison] = React.useState<BranchComparison | null>(null);
  const [preview, setPreview] = React.useState<MergePreview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const previousCurrentRef = React.useRef<string | null>(null);

  const currentBranch = status?.current_branch;
  const selected = branches.find((b) => b.name === selectedBranch) || null;

  React.useEffect(() => {
    if (!repoPath) return;
    refreshBranches().catch((error) => console.error('Failed to load branches', error));
  }, [repoPath]);

  React.useEffect(() => {
    if (selectedBranch) return;
    const current = branches.find((b) => b.current);
    if (current) {
      setSelectedBranch(current.name);
    } else if (branches[0]) {
      setSelectedBranch(branches[0].name);
    }
  }, [branches, selectedBranch]);

  React.useEffect(() => {
    let active = true;
    const runPreview = async () => {
      setComparison(null);
      setPreview(null);
      if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const [nextComparison, nextPreview] = await Promise.all([
          compareBranches(targetBranch, sourceBranch),
          mergePreview(sourceBranch, targetBranch),
        ]);
        if (!active) return;
        setComparison(nextComparison);
        setPreview(nextPreview);
      } catch (error) {
        if (active) {
          console.error('Failed to compare branches or preview merge', error);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    runPreview();
    return () => {
      active = false;
    };
  }, [sourceBranch, targetBranch]);

  React.useEffect(() => {
    const previousCurrent = previousCurrentRef.current;
    if (currentBranch && (targetBranch === null || targetBranch === previousCurrent)) {
      setTargetBranch(currentBranch);
    }
    previousCurrentRef.current = currentBranch ?? null;
  }, [currentBranch, targetBranch]);

  const handleCreateBranch = async (name: string, source: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    const baseRef = source.trim() || currentBranch || undefined;
    setLoading(true);
    try {
      await createBranch(trimmedName, baseRef);
      setSelectedBranch(trimmedName);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async () => {
    if (!selectedBranch || selected?.current || selected?.remote) return;
    const confirmed = window.confirm(`Deseja remover a branch "${selectedBranch}"?`);
    if (!confirmed) return;
    setLoading(true);
    try {
      await deleteBranch(selectedBranch, false);
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
      setPreview(null);
      await refreshBranches();
    } finally {
      setLoading(false);
    }
  };

  const localBranches = branches.filter((b) => !b.remote);
  const remoteBranches = branches.filter((b) => b.remote);
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
  const branchOptions = [...localBranches, ...remoteBranches].map((branch) => ({
    value: branch.name,
    label: formatBranchLabel(branch),
  }));
  const localBranchOptions = localBranches.map((branch) => ({
    value: branch.name,
    label: formatBranchLabel(branch),
  }));
  const isSameBranch = Boolean(sourceBranch && targetBranch && sourceBranch === targetBranch);
  const isMergeReady = Boolean(sourceBranch && targetBranch && !isSameBranch);
  const isTargetNotCurrent = Boolean(targetBranch && currentBranch && targetBranch !== currentBranch);
  const hasNoCommits = Boolean(isMergeReady && comparison && comparison.ahead === 0);
  const hasConflicts = Boolean(preview && preview.conflicts.length > 0);
  const commitCountLabel = comparison ? comparison.ahead : '-';
  const filesChangedLabel = preview ? String(preview.files_changed) : '-';
  const conflictsLabel = preview ? (preview.conflicts.length > 0 ? String(preview.conflicts.length) : 'Nenhum') : '-';
  const mergeDisabled = !isMergeReady || loading || hasNoCommits || hasConflicts;

  return (
    <div className="grid h-full min-h-0 grid-cols-3 gap-4">
      <Panel
        title="Branches"
        className="col-span-1"
        actions={
          <Button size="sm" variant="ghost" onClick={() => refreshBranches()}>
            <RefreshCw size={16} />
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Pesquisar branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              Icon={Search}
              wrapperClassName="flex-1"
            />
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-text3">Locais</div>
            <div className="space-y-1">
              {filteredLocalBranches.length === 0 && (
                <div className="rounded-md bg-surface2/70 px-3 py-2 text-sm text-text3">
                  {hasSearchQuery ? 'Nenhuma branch local encontrada' : 'Nenhuma branch local listada'}
                </div>
              )}
              {filteredLocalBranches.map((branch) => (
                <div
                  key={branch.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBranch(branch.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedBranch(branch.name);
                    }
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    branch.name === selectedBranch ? 'bg-primary/15 text-primary' : 'bg-surface2/60 text-text1 hover:bg-surface2'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    {branch.current && <Check size={16} className="text-success" />}
                    <span className="truncate">{branch.name}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-text3">Remotas</div>
            <div className="space-y-1">
              {filteredRemoteBranches.length === 0 && (
                <div className="rounded-md bg-surface2/70 px-3 py-2 text-sm text-text3">
                  {hasSearchQuery ? 'Nenhuma branch remota encontrada' : 'Nenhuma remota listada'}
                </div>
              )}
              {filteredRemoteBranches.map((branch) => (
                <div
                  key={branch.name}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedBranch(branch.name)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedBranch(branch.name);
                    }
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    branch.name === selectedBranch ? 'bg-primary/15 text-primary' : 'bg-surface2/60 text-text1 hover:bg-surface2'
                  }`}
                >
                  <span className="truncate">{branch.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 border-t border-border1 pt-4">
            <div className="mb-2 text-xs text-text3">
              Selecionada: <span className="font-medium text-text1">{selectedBranch ?? 'Nenhuma'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  if (!selectedBranch || !selected) return;
                  handleCheckout(selectedBranch, selected.remote);
                }}
                disabled={!selectedBranch || !selected || selected.current || loading}
              >
                Checkout
              </Button>
              <Button
                size="sm"
                variant="primary"
                onClick={() => setIsNewBranchModalOpen(true)}
                disabled={loading}
              >
                Nova Branch
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={handleDeleteBranch}
                disabled={!selected || selected.current || selected?.remote || loading}
              >
                Remover
              </Button>
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Merge"
        className="col-span-2"
        actions={
          <Button size="sm" variant="primary" onClick={handleMergeNow} disabled={mergeDisabled}>
            Executar merge
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase text-text3">Merge</div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-text3" htmlFor="merge-source">
                  De
                </label>
                <SelectMenu
                  id="merge-source"
                  value={sourceBranch ?? ''}
                  options={branchOptions}
                  onChange={(value) => setSourceBranch(value as string)}
                  placeholder="Origem"
                />
              </div>
              <ArrowRight className="mt-5 text-text3" size={20} />
              <div className="flex-1">
                <label className="mb-1 block text-xs text-text3" htmlFor="merge-target">
                  Para
                </label>
                <SelectMenu
                  id="merge-target"
                  value={targetBranch ?? ''}
                  options={localBranchOptions}
                  onChange={(value) => setTargetBranch(value as string)}
                  placeholder="Destino"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1 text-xs">
              {isSameBranch && (
                <div className="text-warning">Origem e destino iguais. Ajuste para continuar.</div>
              )}
              {isTargetNotCurrent && targetBranch && (
                <div className="text-warning">Checkout sera feito para {targetBranch} antes do merge.</div>
              )}
              {hasNoCommits && <div className="text-text3">Branches ja sincronizadas.</div>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="text-xs uppercase text-text3">Commits</div>
              <div className="text-xl font-semibold text-text1">{commitCountLabel}</div>
            </div>
            <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="text-xs uppercase text-text3">Arquivos</div>
              <div className="text-xl font-semibold text-text1">{filesChangedLabel}</div>
            </div>
            <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="text-xs uppercase text-text3">Conflitos</div>
              <div className={`text-xl font-semibold ${hasConflicts ? 'text-danger' : 'text-text1'}`}>
                {conflictsLabel}
              </div>
            </div>
          </div>

          {preview && (
            <div className="rounded-md border border-primary/40 bg-primary/10 px-3 py-3 text-sm">
              <div className="flex items-center gap-2 text-primary">
                <GitMerge size={16} />
                <span>Preview de merge</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-text1">
                <div>
                  <div className="text-xs text-text3">Arquivos</div>
                  <div className="text-lg font-semibold">{preview.files_changed}</div>
                </div>
                <div>
                  <div className="text-xs text-text3">+ Insercoes</div>
                  <div className="text-lg font-semibold text-success">{preview.insertions}</div>
                </div>
                <div>
                  <div className="text-xs text-text3">- Remocoes</div>
                  <div className="text-lg font-semibold text-danger">{preview.deletions}</div>
                </div>
              </div>
              {preview.conflicts.length > 0 ? (
                <div className="mt-3 text-sm text-danger">
                  Conflitos detectados:
                  <ul className="list-disc pl-5 text-text1">
                    {preview.conflicts.map((file) => (
                      <li key={file}>{file}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 text-sm text-success">Sem conflitos conhecidos.</div>
              )}
            </div>
          )}

          <div className="rounded-md border border-border1 bg-surface2 px-3 py-3 text-sm">
            <div className="text-xs uppercase text-text3">Commits</div>
            <div className="mt-2 max-h-36 space-y-1 overflow-auto text-text2">
              {(comparison?.commits ?? []).length === 0 ? (
                <div className="text-sm text-text3">Sem commits para merge</div>
              ) : (
                comparison?.commits.map((commit) => (
                  <div key={commit.hash} className="rounded bg-surface1 px-2 py-1 text-xs">
                    <div className="font-semibold text-text1">{commit.message}</div>
                    <div className="text-text3">{commit.author}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Panel>

      <NewBranchModal
        isOpen={isNewBranchModalOpen}
        onClose={() => setIsNewBranchModalOpen(false)}
        branches={branches}
        currentBranch={currentBranch ?? null}
        onCreateBranch={handleCreateBranch}
      />
    </div>
  );
};
