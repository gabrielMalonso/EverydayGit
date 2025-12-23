import React from 'react';
import { Panel } from '@/components/Panel';
import { Button, Input } from '@/ui';
import type { Branch } from '@/types';
import { Check, RefreshCw, Search } from 'lucide-react';

interface BranchesListPanelProps {
  filteredLocalBranches: Branch[];
  filteredRemoteBranches: Branch[];
  selectedBranch: string | null;
  selected: Branch | null;
  searchQuery: string;
  hasSearchQuery: boolean;
  loading: boolean;
  onSearchQueryChange: (value: string) => void;
  onSelectBranch: (branchName: string) => void;
  onCheckout: (branchName: string, isRemote: boolean) => void;
  onDeleteBranch: () => void;
  onOpenNewBranchModal: () => void;
  onRefresh: () => void;
}

export const BranchesListPanel: React.FC<BranchesListPanelProps> = ({
  filteredLocalBranches,
  filteredRemoteBranches,
  selectedBranch,
  selected,
  searchQuery,
  hasSearchQuery,
  loading,
  onSearchQueryChange,
  onSelectBranch,
  onCheckout,
  onDeleteBranch,
  onOpenNewBranchModal,
  onRefresh,
}) => {
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
            {filteredLocalBranches.map((branch) => (
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
              disabled={!selectedBranch || !selected || selected.current || loading}
            >
              Checkout
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={onOpenNewBranchModal}
              disabled={loading}
            >
              Nova Branch
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={onDeleteBranch}
              disabled={!selected || selected.current || selected?.remote || loading}
            >
              Remover
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  );
};
