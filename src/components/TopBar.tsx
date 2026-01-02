import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button, SelectMenu, SelectOption } from '../ui';
import { Badge } from './Badge';
import logoMark from '../assets/logo-mark.svg';
import { PublishRepoModal } from './PublishRepoModal';
import { WorktreeActionModal } from './WorktreeActionModal';
import { BranchInUseModal, parseBranchInUseError } from './BranchInUseModal';
import { useRepoStore } from '../stores/repoStore';
import { useGitStore } from '../stores/gitStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGit } from '../hooks/useGit';
import { useNavigationStore } from '../stores/navigationStore';
import type { RepoSelectionResult, Worktree } from '../types';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, repoState, setRepoSelection } = useRepoStore();
  const { status, branches, worktrees, reset } = useGitStore();
  const { setSettingsOpen } = useSettingsStore();
  const { setPage } = useNavigationStore();
  const { checkoutBranch, checkoutRemoteBranch, refreshBranches, refreshWorktrees, removeWorktree, openInFinder, openWorktreeWindow } = useGit();
  const isTauri = isTauriRuntime();
  const [originUrl, setOriginUrl] = React.useState<string | null | undefined>(undefined);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);
  const [selectedWorktree, setSelectedWorktree] = React.useState<Worktree | null>(null);
  const [branchInUseError, setBranchInUseError] = React.useState<{ branchName: string; worktreePath: string } | null>(null);

  const refreshOrigin = React.useCallback(async () => {
    if (!repoPath || repoState !== 'git' || !isTauri) {
      setOriginUrl(undefined);
      return;
    }
    try {
      const origin = await invoke<string | null>('get_remote_origin_url_cmd');
      setOriginUrl(origin);
    } catch (error) {
      console.error('Failed to get remote origin:', error);
      setOriginUrl(null);
    }
  }, [repoPath, repoState, isTauri]);

  React.useEffect(() => {
    if (!repoPath || repoState !== 'git') return;
    refreshBranches().catch((error) => {
      console.error('Failed to load branches:', error);
    });
    refreshWorktrees().catch((error) => {
      console.error('Failed to load worktrees:', error);
    });
  }, [repoPath, repoState]);

  React.useEffect(() => {
    refreshOrigin();
  }, [refreshOrigin]);

  // Tipo auxiliar para opções de branch com metadados extras
  type BranchOption = SelectOption & {
    kind?: 'local' | 'remote' | 'worktree';
    remoteName?: string;
    worktreePath?: string;
  };

  const branchOptions: BranchOption[] = React.useMemo(() => {
    // Get branches that are in worktrees (excluding main worktree)
    const nonMainWorktreeBranches = new Set(
      worktrees.filter(w => !w.is_main).map(w => w.branch)
    );

    // Helper to normalize branch name (remove leading "+ " if present)
    const normalizeName = (name: string) => name.replace(/^\+ /, '');

    // Filter local branches:
    // - Exclude remote branches
    // - Exclude branches that are in NON-MAIN worktrees (normalized match)
    const localBranches = branches.filter((b) => {
      if (b.remote) return false;
      const normalized = normalizeName(b.name);
      // Skip only if this branch is in a NON-MAIN worktree
      return !nonMainWorktreeBranches.has(normalized);
    });

    const remoteBranches = branches.filter((b) => b.remote);
    const nonMainWorktrees = worktrees.filter(w => !w.is_main);

    // Set of normalized local names for filtering orphan remotes
    const localNameSet = new Set(localBranches.map((b) => normalizeName(b.name)));

    // Get local branch equivalent name from remote: "origin/feature/x" → "feature/x"
    const getLocalName = (remoteName: string) => remoteName.replace(/^[^/]+\//, '');

    // Filter remotes that don't have a local equivalent (checking normalized names)
    const orphanRemotes = remoteBranches.filter((b) => {
      const localEquiv = getLocalName(b.name);
      return !localNameSet.has(localEquiv) && !nonMainWorktreeBranches.has(localEquiv);
    });

    const localOptions: BranchOption[] = localBranches.map((branch) => ({
      value: normalizeName(branch.name), // Use normalized name for checkout
      label: normalizeName(branch.name), // Display normalized name
      disabled: branch.current,
      key: `local-${branch.name}`,
      kind: 'local' as const,
    }));

    const worktreeOptions: BranchOption[] = nonMainWorktrees.map((wt) => ({
      value: `worktree:${wt.path}`,
      label: wt.branch,
      disabled: false, // Now clickable - opens modal
      key: `worktree-${wt.path}`,
      kind: 'worktree' as const,
      worktreePath: wt.path,
    }));

    const remoteOptions: BranchOption[] = orphanRemotes.map((branch) => ({
      value: branch.name,
      label: getLocalName(branch.name), // Mostra nome curto
      disabled: false, // Agora habilitado!
      key: `remote-${branch.name}`,
      kind: 'remote' as const,
      remoteName: branch.name, // Guarda nome completo
    }));

    const result: BranchOption[] = [];

    if (localOptions.length) {
      result.push(...localOptions);
    }

    if (worktreeOptions.length) {
      if (result.length) {
        result.push({ type: 'divider', value: '__divider1__', label: 'divider', key: 'divider1' });
      }
      result.push(...worktreeOptions);
    }

    if (remoteOptions.length) {
      if (result.length) {
        result.push({ type: 'divider', value: '__divider2__', label: 'divider', key: 'divider2' });
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
        const result = await invoke<RepoSelectionResult>('set_repository', { path: selected });
        setRepoSelection(selected, result.is_git ? 'git' : 'no-git');
        if (result.is_git) {
          setPage('commits');
        } else {
          reset();
          setPage('init-repo');
        }
      } catch (error) {
        console.error('Failed to set repository:', error);
        alert(`Error: ${error}`);
      }
    }
  };

  return (
    <div className="relative z-40 h-14 bg-surface1/90 backdrop-blur border-b border-border1 shadow-subtle flex items-center justify-between px-5">
      <div className="flex items-center gap-4">
        <img
          src={logoMark}
          alt="EverydayGit"
          className="h-7 w-7 object-contain"
          draggable={false}
        />
        <h1 className="text-lg font-semibold text-text1">EverydayGit</h1>
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
                if (opt.kind === 'worktree' && opt.worktreePath) {
                  // Find the worktree and open modal
                  const wt = worktrees.find(w => w.path === opt.worktreePath);
                  if (wt) setSelectedWorktree(wt);
                } else if (opt.kind === 'remote' && opt.remoteName) {
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
                    <span className={`truncate ${opt.kind === 'worktree' ? 'text-text-secondary' : ''}`}>
                      {opt.kind === 'worktree' ? `+ ${option.label}` : option.label}
                    </span>
                    {opt.kind === 'worktree' ? (
                      <Badge variant="default">worktree</Badge>
                    ) : opt.kind === 'remote' ? (
                      <Badge variant="warning">remote</Badge>
                    ) : (
                      isSelected && <Badge variant="info">current</Badge>
                    )}
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

      {selectedWorktree && (
        <WorktreeActionModal
          worktree={selectedWorktree}
          isOpen={true}
          onClose={() => setSelectedWorktree(null)}
          onOpenHere={async () => {
            // Change to worktree repo
            try {
              const result = await invoke<RepoSelectionResult>('set_repository', { path: selectedWorktree.path });
              setRepoSelection(selectedWorktree.path, result.is_git ? 'git' : 'no-git');
              if (result.is_git) {
                setPage('commits');
              }
            } catch (error) {
              console.error('Failed to open worktree:', error);
            }
          }}
          onOpenInNewWindow={() => openWorktreeWindow(selectedWorktree.path, selectedWorktree.branch)}
          onOpenInFinder={() => openInFinder(selectedWorktree.path)}
          onRemove={async () => {
            await removeWorktree(selectedWorktree.path);
            setSelectedWorktree(null);
          }}
        />
      )}

      {branchInUseError && (
        <BranchInUseModal
          isOpen={true}
          branchName={branchInUseError.branchName}
          worktreePath={branchInUseError.worktreePath}
          onClose={() => setBranchInUseError(null)}
          onOpenWorktree={async () => {
            // Open the conflicting worktree
            try {
              const result = await invoke<RepoSelectionResult>('set_repository', { path: branchInUseError.worktreePath });
              setRepoSelection(branchInUseError.worktreePath, result.is_git ? 'git' : 'no-git');
              if (result.is_git) {
                setPage('commits');
              }
            } catch (error) {
              console.error('Failed to open worktree:', error);
            }
          }}
          onRemoveWorktree={async () => {
            // Remove the worktree and retry checkout
            try {
              await removeWorktree(branchInUseError.worktreePath);
              await refreshWorktrees();
              // Retry checkout
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
