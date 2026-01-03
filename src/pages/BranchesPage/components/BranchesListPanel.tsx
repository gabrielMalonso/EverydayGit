import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { WorktreeActionModal } from '@/components/WorktreeActionModal';
import { RemoveWorktreeModal } from './RemoveWorktreeModal';
import { AnimatedTabs, Button, Input, Spinner } from '@/ui';
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
  const [activeTab, setActiveTab] = React.useState<'branches' | 'worktrees'>('branches');
  const [selectedWorktree, setSelectedWorktree] = React.useState<Worktree | null>(null);
  const [isWorktreeModalOpen, setIsWorktreeModalOpen] = React.useState(false);
  const [isRemoveWorktreeModalOpen, setIsRemoveWorktreeModalOpen] = React.useState(false);
  const [worktreePendingRemoval, setWorktreePendingRemoval] = React.useState<Worktree | null>(null);
  const nonMainWorktrees = worktrees.filter((worktree) => !worktree.is_main);

  React.useEffect(() => {
    if (!selectedWorktree) return;
    const stillExists = nonMainWorktrees.some((worktree) => worktree.path === selectedWorktree.path);
    if (!stillExists) {
      setSelectedWorktree(null);
    }
  }, [nonMainWorktrees, selectedWorktree]);

  const tabs = (
    <AnimatedTabs
      ariaLabel="Branches and worktrees"
      value={activeTab}
      onChange={(next) => setActiveTab(next as 'branches' | 'worktrees')}
      items={[
        { key: 'branches', label: 'Branches' },
        { key: 'worktrees', label: 'Worktrees' },
      ]}
      containerClassName="rounded-button border border-border1 bg-surface2 p-1.5"
      tabClassName="rounded-button px-3 py-1.5 text-[15px] font-medium transition-colors"
      activeTextClassName="text-text1"
      inactiveTextClassName="text-text3 hover:text-text1"
      indicatorClassName="rounded-button bg-surface1 shadow-subtle"
    />
  );

  const worktreeFooterDisabled = !selectedWorktree;
  const requestRemoveWorktree = (worktree: Worktree) => {
    setWorktreePendingRemoval(worktree);
    setIsRemoveWorktreeModalOpen(true);
  };

  return (
    <Panel
      headerLeft={tabs}
      className="col-span-1"
      headerClassName="py-2"
      actions={
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          <RefreshCw size={16} />
        </Button>
      }
    >
      <div className="flex flex-col gap-4 p-4">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'branches' ? (
            <motion.div
              key="branches"
              role="tabpanel"
              id="branches-tab-panel"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
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
            </motion.div>
          ) : (
            <motion.div
              key="worktrees"
              role="tabpanel"
              id="worktrees-tab-panel"
              className="flex flex-col gap-4"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
            >
              <div>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-text3">
                  <Folder size={14} />
                  Worktrees
                </div>
                <div className="space-y-1">
                  {nonMainWorktrees.length === 0 && (
                    <div className="rounded-md bg-surface2/70 px-3 py-2 text-sm text-text3">
                      Nenhuma worktree ativa
                    </div>
                  )}
                  {nonMainWorktrees.map((worktree) => {
                    const isSelected = selectedWorktree?.path === worktree.path;
                    return (
                      <div
                        key={worktree.path}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedWorktree(worktree)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedWorktree(worktree);
                          }
                        }}
                        className={`rounded-md px-3 py-2 text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/15 text-primary'
                            : 'bg-surface2/60 text-text1 hover:bg-surface2'
                        }`}
                      >
                        <div className="text-sm font-medium">{worktree.branch}</div>
                        <div className="truncate text-xs text-text3" title={worktree.path}>
                          {worktree.path}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 border-t border-border1 pt-4">
                <div className="mb-2 text-xs text-text3">
                  Selecionada:{' '}
                  <span className="font-medium text-text1">{selectedWorktree?.branch ?? 'Nenhuma'}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setIsWorktreeModalOpen(true)}
                    disabled={worktreeFooterDisabled}
                  >
                    Abrir...
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      if (!selectedWorktree) return;
                      requestRemoveWorktree(selectedWorktree);
                    }}
                    disabled={worktreeFooterDisabled}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {selectedWorktree && (
        <WorktreeActionModal
          worktree={selectedWorktree}
          isOpen={isWorktreeModalOpen}
          onClose={() => setIsWorktreeModalOpen(false)}
          onOpenInNewTab={() => onOpenWorktree(selectedWorktree)}
          onOpenInFinder={() => onOpenWorktreeInFinder(selectedWorktree.path)}
          onRequestRemove={() => requestRemoveWorktree(selectedWorktree)}
        />
      )}

      <RemoveWorktreeModal
        isOpen={isRemoveWorktreeModalOpen}
        onClose={() => setIsRemoveWorktreeModalOpen(false)}
        worktree={worktreePendingRemoval}
        onConfirm={async (worktree) => {
          await onRemoveWorktree(worktree.path);
        }}
      />
    </Panel>
  );
};
