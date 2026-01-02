import React, { useEffect, useState } from 'react';
import { FolderOpen, Trash2, MoreVertical } from 'lucide-react';
import { Panel } from './Panel';
import { ListItem } from './ListItem';
import { Badge } from './Badge';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useGit } from '../hooks/useGit';
import type { Worktree } from '../types';

interface BranchesPanelProps {
  className?: string;
}

interface WorktreeMenuProps {
  worktree: Worktree;
  onOpenInFinder: () => void;
  onRemove: () => void;
  onClose: () => void;
}

const WorktreeMenu: React.FC<WorktreeMenuProps> = ({ worktree, onOpenInFinder, onRemove, onClose }) => {
  return (
    <div
      className="absolute right-0 top-full mt-1 bg-surface-elevated border border-border rounded-lg shadow-lg z-50 min-w-[180px]"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-surface-hover flex items-center gap-2 rounded-t-lg"
        onClick={() => { onOpenInFinder(); onClose(); }}
      >
        <FolderOpen size={14} />
        Abrir no Finder
      </button>
      {!worktree.is_main && (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-surface-hover flex items-center gap-2 text-red-400 rounded-b-lg"
          onClick={() => { onRemove(); onClose(); }}
        >
          <Trash2 size={14} />
          Remover Worktree
        </button>
      )}
    </div>
  );
};

export const BranchesPanel: React.FC<BranchesPanelProps> = ({ className = '' }) => {
  const { branches, worktrees } = useGitStore();
  const { repoPath } = useRepoStore();
  const { refreshBranches, refreshWorktrees, checkoutBranch, removeWorktree, openInFinder } = useGit();
  const [activeWorktreeMenu, setActiveWorktreeMenu] = useState<string | null>(null);

  useEffect(() => {
    if (repoPath) {
      refreshBranches();
      refreshWorktrees();
    }
  }, [repoPath]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveWorktreeMenu(null);
    if (activeWorktreeMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeWorktreeMenu]);

  const handleCheckout = async (branchName: string) => {
    try {
      await checkoutBranch(branchName);
    } catch (error) {
      alert(`Failed to checkout branch: ${error}`);
    }
  };

  const handleRemoveWorktree = async (worktreePath: string) => {
    if (confirm('Tem certeza que deseja remover esta worktree? Os arquivos no diretório serão mantidos.')) {
      try {
        await removeWorktree(worktreePath);
      } catch (error) {
        console.error('Failed to remove worktree:', error);
      }
    }
  };

  // Get branches that are in worktrees (excluding main worktree)
  const worktreeBranches = new Set(
    worktrees.filter(w => !w.is_main).map(w => w.branch)
  );

  // Filter out branches that are in worktrees
  const localBranches = branches.filter(b => !b.remote && !worktreeBranches.has(b.name));
  const remoteBranches = branches.filter(b => b.remote);
  const nonMainWorktrees = worktrees.filter(w => !w.is_main);

  return (
    <Panel title="Branches" className={className} collapsible collapseKey="branches">
      <div className="flex flex-col">
        <div className="px-4 py-2 text-xs text-text-secondary font-semibold uppercase">
          Local
        </div>
        {localBranches.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text-secondary">
            No local branches
          </div>
        ) : (
          localBranches.map((branch) => (
            <ListItem
              key={branch.name}
              active={branch.current}
              onClick={() => !branch.current && handleCheckout(branch.name)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm">{branch.name}</span>
                {branch.current && <Badge variant="info">current</Badge>}
              </div>
            </ListItem>
          ))
        )}

        {nonMainWorktrees.length > 0 && (
          <>
            <div className="px-4 py-2 mt-4 text-xs text-text-secondary font-semibold uppercase flex items-center gap-2">
              <FolderOpen size={12} />
              Worktrees
            </div>
            {nonMainWorktrees.map((worktree) => (
              <ListItem key={worktree.path} className="relative">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-sm">{worktree.branch}</span>
                    <span className="text-xs text-text-secondary truncate max-w-[180px]" title={worktree.path}>
                      {worktree.path.split('/').slice(-2).join('/')}
                    </span>
                  </div>
                  <button
                    className="p-1 hover:bg-surface-hover rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWorktreeMenu(activeWorktreeMenu === worktree.path ? null : worktree.path);
                    }}
                  >
                    <MoreVertical size={14} />
                  </button>
                </div>
                {activeWorktreeMenu === worktree.path && (
                  <WorktreeMenu
                    worktree={worktree}
                    onOpenInFinder={() => openInFinder(worktree.path)}
                    onRemove={() => handleRemoveWorktree(worktree.path)}
                    onClose={() => setActiveWorktreeMenu(null)}
                  />
                )}
              </ListItem>
            ))}
          </>
        )}

        <div className="px-4 py-2 mt-4 text-xs text-text-secondary font-semibold uppercase">
          Remote
        </div>
        {remoteBranches.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text-secondary">
            No remote branches
          </div>
        ) : (
          remoteBranches.slice(0, 10).map((branch) => (
            <ListItem key={branch.name}>
              <span className="text-sm text-text-secondary">{branch.name}</span>
            </ListItem>
          ))
        )}
      </div>
    </Panel>
  );
};
