import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button, SelectMenu, SelectOption } from '../ui';
import { Badge } from './Badge';
import { PublishRepoModal } from './PublishRepoModal';
import { useRepoStore } from '../stores/repoStore';
import { useGitStore } from '../stores/gitStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGit } from '../hooks/useGit';
import { useNavigationStore } from '../stores/navigationStore';
import type { RepoSelectionResult } from '../types';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, repoState, setRepoSelection } = useRepoStore();
  const { status, branches, reset } = useGitStore();
  const { setSettingsOpen } = useSettingsStore();
  const { setPage } = useNavigationStore();
  const { checkoutBranch, checkoutRemoteBranch, refreshBranches } = useGit();
  const isTauri = isTauriRuntime();
  const [originUrl, setOriginUrl] = React.useState<string | null | undefined>(undefined);
  const [isPublishOpen, setIsPublishOpen] = React.useState(false);

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
  }, [repoPath, repoState]);

  React.useEffect(() => {
    refreshOrigin();
  }, [refreshOrigin]);

  // Tipo auxiliar para opções de branch com metadados extras
  type BranchOption = SelectOption & {
    kind?: 'local' | 'remote';
    remoteName?: string;
  };

  const branchOptions: BranchOption[] = React.useMemo(() => {
    const localBranches = branches.filter((b) => !b.remote);
    const remoteBranches = branches.filter((b) => b.remote);

    // Set de nomes locais para filtro
    const localNameSet = new Set(localBranches.map((b) => b.name));

    // Função para derivar nome local de remota: "origin/feature/x" → "feature/x"
    const getLocalName = (remoteName: string) => remoteName.replace(/^[^/]+\//, '');

    // Filtra remotas que não têm equivalente local
    const orphanRemotes = remoteBranches.filter(
      (b) => !localNameSet.has(getLocalName(b.name))
    );

    const localOptions: BranchOption[] = localBranches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      disabled: branch.current,
      key: `local-${branch.name}`,
      kind: 'local' as const,
    }));

    const remoteOptions: BranchOption[] = orphanRemotes.map((branch) => ({
      value: branch.name,
      label: getLocalName(branch.name), // Mostra nome curto
      disabled: false, // Agora habilitado!
      key: `remote-${branch.name}`,
      kind: 'remote' as const,
      remoteName: branch.name, // Guarda nome completo
    }));

    if (localOptions.length && remoteOptions.length) {
      return [
        ...localOptions,
        { type: 'divider', value: '__divider__', label: 'divider', key: 'divider' },
        ...remoteOptions,
      ];
    }

    return [...localOptions, ...remoteOptions];
  }, [branches]);

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
        <h1 className="text-lg font-semibold text-text1">GitFlow AI</h1>
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
              onChange={(value, option) => {
                const opt = option as BranchOption;
                if (opt.kind === 'remote' && opt.remoteName) {
                  checkoutRemoteBranch(opt.remoteName);
                } else {
                  checkoutBranch(String(value));
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
                    {opt.kind === 'remote' ? (
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
    </div>
  );
};
