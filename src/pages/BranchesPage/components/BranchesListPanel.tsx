import React from 'react';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { Button, Input, Spinner } from '@/ui';
import type { Branch, Worktree } from '@/types';
import { ArrowDown, ArrowUp, Check, Folder, RefreshCw, Search } from 'lucide-react';

interface BranchesListPanelProps {
  filteredLocalBranches: Branch[];
  filteredRemoteBranches: Branch[];
  worktrees: Worktree[];
  worktreeBranches: Set<string>;
  selectedBranch: string | null;
  selected: Branch | null;
  searchQuery: string;
  hasSearchQuery: boolean;
  loading: boolean;
  isPushing: boolean;
  isPulling: boolean;
  isMergeInProgress?: boolean;
  onSearchQueryChange: (value: string) => void;
  onSelectBranch: (branchName: string) => void;
  onCheckout: (branchName: string, isRemote: boolean) => void;
  onDeleteBranch: () => void;
  onOpenNewBranchModal: () => void;
  onRefresh: () => void;
  onPush: () => void;
  onPull: () => void;
  onOpenWorktree: (worktree: Worktree) => void;
  onOpenWorktreeInFinder: (path: string) => void;
  onRemoveWorktree: (path: string) => void;
}

export const BranchesListPanel: React.FC<BranchesListPanelProps> = ({
  filteredLocalBranches,
  filteredRemoteBranches,
  worktrees,
  worktreeBranches,
  selectedBranch,
  selected,
  searchQuery,
  hasSearchQuery,
  loading,
  isPushing,
  isPulling,
  isMergeInProgress,
  onSearchQueryChange,
  onSelectBranch,
  onCheckout,
  onDeleteBranch,
  onOpenNewBranchModal,
  onRefresh,
  onPush,
  onPull,
  onOpenWorktree,
  onOpenWorktreeInFinder,
  onRemoveWorktree,
}) => {
  const nonMainWorktrees = worktrees.filter((worktree) => !worktree.is_main);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredWorktrees = normalizedQuery
    ? nonMainWorktrees.filter(
        (worktree) =>
          worktree.branch.toLowerCase().includes(normalizedQuery) ||
          worktree.path.toLowerCase().includes(normalizedQuery),
      )
    : nonMainWorktrees;

  return (
    <Panel
      title="Branches"
      className="col-span-1"
      actions={
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          <RefreshCw size={16} />
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Pesquisar branches..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
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
            {filteredLocalBranches.map((branch) => {
              const normalizedName = branch.name.replace(/^\+ /, '');
              const isInWorktree = worktreeBranches.has(normalizedName);
              const isSelected = normalizedName === selectedBranch;

              return (
              <div
                key={branch.name}
                role={isInWorktree ? undefined : 'button'}
                tabIndex={isInWorktree ? -1 : 0}
                onClick={() => {
                  if (isInWorktree) return;
                  onSelectBranch(normalizedName);
                }}
                onKeyDown={(e) => {
                  if (isInWorktree) return;
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBranch(normalizedName);
                  }
                }}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  isSelected
                    ? 'bg-primary/15 text-primary'
                    : isInWorktree
                      ? 'bg-surface2/40 text-text2'
                      : 'bg-surface2/60 text-text1 hover:bg-surface2'
                } ${isInWorktree ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="flex items-center gap-2 truncate">
                  {branch.current && <Check size={16} className="text-success" />}
                  <span className="truncate">{normalizedName}</span>
                </span>
                {isInWorktree && <Badge variant="default">em worktree</Badge>}
              </div>
            );
            })}
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
                onClick={() => onSelectBranch(branch.name)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectBranch(branch.name);
                  }
                }}
                className={`flex w-full cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  branch.name === selectedBranch
                    ? 'bg-primary/15 text-primary'
                    : 'bg-surface2/60 text-text1 hover:bg-surface2'
                }`}
              >
                <span className="truncate">{branch.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-text3">
            <Folder size={14} />
            Worktrees
          </div>
          <div className="space-y-2">
            {filteredWorktrees.length === 0 && (
              <div className="rounded-md bg-surface2/70 px-3 py-2 text-sm text-text3">
                {hasSearchQuery ? 'Nenhuma worktree encontrada' : 'Nenhuma worktree ativa'}
              </div>
            )}
            {filteredWorktrees.map((worktree) => (
              <div key={worktree.path} className="rounded-md bg-surface2/60 px-3 py-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-text1">{worktree.branch}</div>
                    <div className="truncate text-xs text-text3" title={worktree.path}>
                      {worktree.path}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => onOpenWorktree(worktree)}
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => onOpenWorktreeInFinder(worktree.path)}
                    >
                      Finder
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      className="h-8 px-2 text-xs"
                      onClick={() => onRemoveWorktree(worktree.path)}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-border1 pt-4">
          {isMergeInProgress && (
            <div className="mb-3 rounded-card-inner border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              <span className="font-medium">Merge em andamento:</span> Operações bloqueadas.
            </div>
          )}
          <div className="mb-2 text-xs text-text3">
            Selecionada: <span className="font-medium text-text1">{selectedBranch ?? 'Nenhuma'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                if (!selectedBranch || !selected) return;
                onCheckout(selectedBranch, selected.remote);
              }}
              disabled={!selectedBranch || !selected || selected.current || loading || isMergeInProgress}
              title={isMergeInProgress ? 'Checkout bloqueado durante merge' : undefined}
            >
              Checkout
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewBranchModal}
              disabled={loading || isMergeInProgress}
              title={isMergeInProgress ? 'Criar branch bloqueado durante merge' : undefined}
            >
              Nova Branch
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDeleteBranch}
              disabled={!selected || selected.current || loading || isMergeInProgress}
              title={isMergeInProgress ? 'Remover branch bloqueado durante merge' : undefined}
            >
              Remover
            </Button>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onPush}
              disabled={loading || isPushing || isPulling || isMergeInProgress}
              title={isMergeInProgress ? 'Push bloqueado durante merge' : 'Push (branch atual)'}
            >
              {isPushing ? <Spinner className="h-4 w-4" label="Pushing" /> : <ArrowUp size={16} />}
              Push
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onPull}
              disabled={loading || isPushing || isPulling || isMergeInProgress}
              title={isMergeInProgress ? 'Pull bloqueado durante merge' : 'Pull (branch atual)'}
            >
              {isPulling ? <Spinner className="h-4 w-4" label="Pulling" /> : <ArrowDown size={16} />}
              Pull
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
