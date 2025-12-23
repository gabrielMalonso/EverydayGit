import React from 'react';
import { Panel } from '@/components/Panel';
import { Button, Input, SelectMenu } from '@/ui';
import { useGitStore } from '@/stores/gitStore';
import { useRepoStore } from '@/stores/repoStore';
import { useGit } from '@/hooks/useGit';
import type { Branch, BranchComparison, MergePreview } from '@/types';
import { ArrowRight, Check, GitBranch, GitMerge, Plus, RefreshCw, Trash2 } from 'lucide-react';

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
  const [newBranchName, setNewBranchName] = React.useState('');
  const [comparison, setComparison] = React.useState<BranchComparison | null>(null);
  const [preview, setPreview] = React.useState<MergePreview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [actionNote, setActionNote] = React.useState<string | null>(null);
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
    const runComparison = async () => {
      setComparison(null);
      setPreview(null);
      if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) {
        return;
      }
      try {
        setLoading(true);
        const result = await compareBranches(targetBranch, sourceBranch);
        setComparison(result);
      } catch (error) {
        console.error('Failed to compare branches', error);
      } finally {
        setLoading(false);
      }
    };

    runComparison();
  }, [sourceBranch, targetBranch]);

  React.useEffect(() => {
    const previousCurrent = previousCurrentRef.current;
    if (currentBranch && (targetBranch === null || targetBranch === previousCurrent)) {
      setTargetBranch(currentBranch);
    }
    previousCurrentRef.current = currentBranch ?? null;
  }, [currentBranch, targetBranch]);

  const handleCreateBranch = async () => {
    const name = newBranchName.trim();
    if (!name) return;
    setLoading(true);
    try {
      await createBranch(name, currentBranch ?? undefined);
      await refreshBranches();
      setSelectedBranch(name);
      setNewBranchName('');
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
      setActionNote(`Branch atualizada para ${branchName}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewMerge = async () => {
    if (!sourceBranch || !targetBranch || sourceBranch === targetBranch) return;
    if (comparison && comparison.ahead === 0) return;
    setLoading(true);
    try {
      const nextPreview = await mergePreview(sourceBranch, targetBranch);
      setPreview(nextPreview);
      setActionNote(`Preview de merge de ${sourceBranch} -> ${targetBranch}`);
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
      const result = await mergeBranch(sourceBranch);
      setActionNote(result.summary);
      setPreview(null);
      await refreshBranches();
    } finally {
      setLoading(false);
    }
  };

  const localBranches = branches.filter((b) => !b.remote);
  const remoteBranches = branches.filter((b) => b.remote);
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
  const previewDisabled = !isMergeReady || loading || hasNoCommits;
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
              placeholder="Nova branch"
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              wrapperClassName="flex-1"
            />
            <Button onClick={handleCreateBranch} disabled={!newBranchName.trim()} size="sm">
              <Plus size={16} />
            </Button>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-text3">Locais</div>
            <div className="space-y-1">
              {localBranches.map((branch) => (
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(branch.name, false);
                    }}
                    disabled={branch.current || loading}
                  >
                    Checkout
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase text-text3">Remotas</div>
            <div className="space-y-1">
              {remoteBranches.length === 0 && (
                <div className="rounded-md bg-surface2/70 px-3 py-2 text-sm text-text3">
                  Nenhuma remota listada
                </div>
              )}
              {remoteBranches.map((branch) => (
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
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!h-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCheckout(branch.name, true);
                    }}
                    disabled={loading}
                  >
                    Checkout
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel
        title="Detalhes"
        className="col-span-2"
        actions={
          <Button
            size="sm"
            variant="danger"
            onClick={handleDeleteBranch}
            disabled={!selected || selected.current || selected?.remote || loading}
          >
            <Trash2 size={16} /> Remover
          </Button>
        }
      >
        <div className="flex flex-col gap-4 p-4">
          <div className="space-y-2">
            <div className="text-sm text-text3">Branch selecionada</div>
            <div className="flex items-center gap-2 text-lg font-semibold text-text1">
              <GitBranch size={18} />
              <span>{selectedBranch ?? 'Nenhuma'}</span>
            </div>
            <div className="text-sm text-text3">
              {selected?.current ? 'Branch atual' : selected?.remote ? 'Remota' : 'Local'}
            </div>

            {actionNote && (
              <div className="mt-2 rounded-md border border-border1 bg-surface2 px-3 py-2 text-sm text-text2">
                {actionNote}
              </div>
            )}
          </div>

          <div className="h-px w-full bg-border1/60" />

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

          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={handlePreviewMerge} disabled={previewDisabled}>
              <GitMerge size={16} /> Preview merge
            </Button>
            <Button size="sm" variant="primary" onClick={handleMergeNow} disabled={mergeDisabled}>
              Executar merge
            </Button>
          </div>

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
        </div>
      </Panel>
    </div>
  );
};
