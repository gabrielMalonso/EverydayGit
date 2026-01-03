import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button, SelectMenu, SelectOption } from '../ui';
import { Badge } from './Badge';
import { PublishRepoModal } from './PublishRepoModal';
import { BranchInUseModal, parseBranchInUseError } from './BranchInUseModal';
import { useSettingsStore } from '../stores/settingsStore';
import { useTabGit } from '@/hooks/useTabGit';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import { useContextKey } from '@/hooks/useTabId';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, repoState, setRepository } = useTabRepo();
  const { status, branches, worktrees, refreshBranches, refreshWorktrees, checkoutBranch, checkoutRemoteBranch, removeWorktree, openWorktreeInNewTab } = useTabGit();
  const { setPage } = useTabNavigation();
  const { resetTabGit } = useTabStore();
  const { setSettingsOpen } = useSettingsStore();
  const isTauri = isTauriRuntime();
  const contextKey = useContextKey();
  const tabId = useCurrentTabId();
  const [originUrl, setOriginUrl] = React.useState<string | null | undefined>(undefined);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);
  const [branchInUseError, setBranchInUseError] = React.useState<{ branchName: string; worktreePath: string } | null>(null);

  const refreshOrigin = React.useCallback(async () => {
    if (!repoPath || repoState !== 'git' || !isTauri) {
      setOriginUrl(undefined);
      return;
    }
    try {
      const origin = await invoke<string | null>('get_remote_origin_url_cmd', { contextKey });
      setOriginUrl(origin);
    } catch (error) {
      console.error('Failed to get remote origin:', error);
      setOriginUrl(null);
    }
  }, [repoPath, repoState, isTauri, contextKey]);

  React.useEffect(() => {
    if (!repoPath || repoState !== 'git') return;
    refreshBranches().catch((error) => {
      console.error('Failed to load branches:', error);
    });
    refreshWorktrees().catch((error) => {
      console.error('Failed to load worktrees:', error);
    });
  }, [repoPath, repoState, refreshBranches, refreshWorktrees]);

  React.useEffect(() => {
    refreshOrigin();
  }, [refreshOrigin]);

  type BranchOption = SelectOption & {
    kind?: 'local' | 'remote';
    remoteName?: string;
    inWorktree?: boolean;
  };

  const branchOptions: BranchOption[] = React.useMemo(() => {
    const nonMainWorktreeBranches = new Set(worktrees.filter(w => !w.is_main).map(w => w.branch));

    const normalizeName = (name: string) => name.replace(/^\+ /, '');

    const localBranches = branches.filter((b) => !b.remote);
    const remoteBranches = branches.filter((b) => b.remote);

    const localNameSet = new Set(localBranches.map((b) => normalizeName(b.name)));

    const getLocalName = (remoteName: string) => remoteName.replace(/^[^/]+\//, '');

    const orphanRemotes = remoteBranches.filter((b) => {
      const localEquiv = getLocalName(b.name);
      return !localNameSet.has(localEquiv) && !nonMainWorktreeBranches.has(localEquiv);
    });

    const localOptions: BranchOption[] = localBranches.map((branch) => ({
      value: normalizeName(branch.name),
      label: normalizeName(branch.name),
      disabled: branch.current,
      key: `local-${branch.name}`,
      kind: 'local' as const,
      inWorktree: nonMainWorktreeBranches.has(normalizeName(branch.name)),
    }));

    const remoteOptions: BranchOption[] = orphanRemotes.map((branch) => ({
      value: branch.name,
      label: getLocalName(branch.name),
      disabled: false,
      key: `remote-${branch.name}`,
      kind: 'remote' as const,
      remoteName: branch.name,
    }));

    const result: BranchOption[] = [];

    if (localOptions.length) {
      result.push(...localOptions);
    }

    if (remoteOptions.length) {
      if (result.length) {
        result.push({ type: 'divider', value: '__divider1__', label: 'divider', key: 'divider1' });
      }
      result.push(...remoteOptions);
    }

    return result;
  }, [branches, worktrees]);

  const handleSelectRepo = async () => {
    if (!isTauriRuntime()) {
      alert('This action only works in the Tauri app. Use `npm run tauri dev` to open repositories.');
      return;
    }

    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select Git Repository',
    });

    if (selected && typeof selected === 'string') {
      try {
        const result = await setRepository(selected);
        if (result.is_git) {
          setPage('commits');
        } else {
          resetTabGit(tabId);
          setPage('init-repo');
        }
      } catch (error) {
        console.error('Failed to set repository:', error);
        alert(`Error: ${error}`);
      }
    }
  };

  return (
    <div className="relative z-40 h-12 bg-surface1/90 backdrop-blur border-b border-border1 shadow-subtle flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        {!repoPath ? (
          <Button onClick={handleSelectRepo} size="sm" variant="primary">
            Open Repository
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text2 truncate max-w-[240px]">
              {repoPath.split('/').pop()}
            </span>
            <Button onClick={handleSelectRepo} variant="ghost" size="sm">
              Change
            </Button>
          </div>
        )}
      </div>

      {status && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text3">Branch</span>
            <SelectMenu
              id="branch-selector"
              value={status.current_branch}
              options={branchOptions}
              onChange={async (value, option) => {
                const opt = option as BranchOption;
                if (opt.kind === 'remote' && opt.remoteName) {
                  try {
                    await checkoutRemoteBranch(opt.remoteName);
                  } catch (error) {
                    const errorStr = String(error);
                    const parsed = parseBranchInUseError(errorStr);
                    if (parsed) {
                      setBranchInUseError(parsed);
                    }
                  }
                } else {
                  try {
                    await checkoutBranch(String(value));
                  } catch (error) {
                    const errorStr = String(error);
                    const parsed = parseBranchInUseError(errorStr);
                    if (parsed) {
                      setBranchInUseError(parsed);
                    }
                  }
                }
              }}
              align="right"
              menuWidthClass="min-w-[180px]"
              buttonClassName="flex items-center gap-2 rounded-card border border-border1 bg-surface3/80 px-3 py-1.5 text-sm text-text1 shadow-popover ring-1 ring-black/20 backdrop-blur-xl"
              buttonContentClassName="flex min-w-0 max-w-[160px] items-center gap-2 truncate"
              renderTriggerValue={(option) => (
                <span className="truncate text-text1">{option?.label ?? status.current_branch}</span>
              )}
              renderOptionLabel={(option, { isSelected }) => {
                const opt = option as BranchOption;
                return (
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate">{option.label}</span>
                    <div className="flex items-center gap-1">
                      {opt.inWorktree && <Badge variant="default">em worktree</Badge>}
                      {opt.kind === 'remote' ? (
                        <Badge variant="warning">remote</Badge>
                      ) : (
                        isSelected && <Badge variant="info">current</Badge>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </div>

          {originUrl === null && isTauri && (
            <Button onClick={() => setIsPublishOpen(true)} variant="secondary" size="sm">
              Publicar no GitHub
            </Button>
          )}

          {status.behind > 0 && <Badge variant="warning">↓ {status.behind}</Badge>}

          <Button onClick={() => setSettingsOpen(true)} variant="ghost" size="sm">
            Settings
          </Button>
        </div>
      )}

      <PublishRepoModal
        isOpen={isPublishOpen}
        onClose={() => setIsPublishOpen(false)}
        repoPath={repoPath}
        defaultName={repoPath ? repoPath.split(/[\\/]/).pop() || repoPath : ''}
        onPublished={() => refreshOrigin()}
      />

      {branchInUseError && (
        <BranchInUseModal
          isOpen={true}
          branchName={branchInUseError.branchName}
          worktreePath={branchInUseError.worktreePath}
          onClose={() => setBranchInUseError(null)}
          onOpenWorktree={async () => {
            try {
              await openWorktreeInNewTab(branchInUseError.worktreePath, branchInUseError.branchName);
            } catch (error) {
              console.error('Failed to open worktree:', error);
            }
          }}
          onRemoveWorktree={async () => {
            try {
              await removeWorktree(branchInUseError.worktreePath);
              await refreshWorktrees();
              await checkoutBranch(branchInUseError.branchName);
              setBranchInUseError(null);
            } catch (error) {
              console.error('Failed to remove worktree:', error);
            }
          }}
        />
      )}
    </div>
  );
};
