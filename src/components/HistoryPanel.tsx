import React, { useEffect } from 'react';
import { Panel } from './Panel';
import { ListItem } from './ListItem';
import { CommitTooltipContent } from './CommitTooltipContent';
import { useGitStore } from '../stores/gitStore';
import { useRepoStore } from '../stores/repoStore';
import { useGit } from '../hooks/useGit';
import { Tooltip } from '../ui';

interface HistoryPanelProps {
  className?: string;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({ className = '' }) => {
  const { commits } = useGitStore();
  const { repoPath } = useRepoStore();
  const { refreshCommits } = useGit();

  useEffect(() => {
    if (repoPath) {
      refreshCommits(50);
    }
  }, [repoPath]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Panel title="History" className={className} collapsible collapseKey="history">
      <div className="flex flex-col">
        {commits.length === 0 ? (
          <div className="px-4 py-2 text-sm text-text-secondary">
            No commits yet
          </div>
        ) : (
          commits.map((commit) => (
            <Tooltip key={commit.hash} delay={300} content={<CommitTooltipContent commit={commit} />}>
              <ListItem>
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-text-primary font-medium">
                    {commit.message}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span>{commit.author}</span>
                    <span>•</span>
                    <span>{formatDate(commit.date)}</span>
                    <span>•</span>
                    <span className="font-mono">{commit.hash.substring(0, 7)}</span>
                  </div>
                </div>
              </ListItem>
            </Tooltip>
          ))
        )}
      </div>
    </Panel>
  );
};
