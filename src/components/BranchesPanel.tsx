import React, { useEffect } from 'react';
import { Panel } from './Panel';
import { ListItem } from './ListItem';
import { Badge } from './Badge';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useGit } from '../hooks/useGit';

interface BranchesPanelProps {
  className?: string;
}

export const BranchesPanel: React.FC<BranchesPanelProps> = ({ className = '' }) => {
  const { branches } = useGitStore();
  const { repoPath } = useRepoStore();
  const { refreshBranches, checkoutBranch } = useGit();

  useEffect(() => {
    if (repoPath) {
      refreshBranches();
    }
  }, [repoPath]);

  const handleCheckout = async (branchName: string) => {
    try {
      await checkoutBranch(branchName);
    } catch (error) {
      alert(`Failed to checkout branch: ${error}`);
    }
  };

  const localBranches = branches.filter(b => !b.remote);
  const remoteBranches = branches.filter(b => b.remote);

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
