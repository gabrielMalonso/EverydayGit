import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button, SelectMenu, SelectOption } from '../ui';
import { Badge } from './Badge';
import { useRepoStore } from '../stores/repoStore';
import { useGitStore } from '../stores/gitStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useGit } from '../hooks/useGit';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, setRepoPath } = useRepoStore();
  const { status, branches } = useGitStore();
  const { setSettingsOpen } = useSettingsStore();
  const { checkoutBranch, refreshBranches } = useGit();

  React.useEffect(() => {
    if (!repoPath) return;
    refreshBranches().catch((error) => {
      console.error('Failed to load branches:', error);
    });
  }, [repoPath]);

  const branchOptions: SelectOption[] = React.useMemo(() => {
    const localBranches = branches.filter((branch) => !branch.remote);
    const remoteBranches = branches.filter((branch) => branch.remote);
    const localOptions = localBranches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      disabled: branch.current,
      key: `local-${branch.name}`,
    }));
    const remoteOptions = remoteBranches.map((branch) => ({
      value: branch.name,
      label: branch.name,
      disabled: true,
      key: `remote-${branch.name}`,
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
        await invoke('set_repository', { path: selected });
        setRepoPath(selected);
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
              onChange={(value) => checkoutBranch(String(value))}
              align="right"
              menuWidthClass="min-w-[180px]"
              buttonClassName="flex items-center gap-2 rounded-card border border-border1 bg-surface3/80 px-3 py-1.5 text-sm text-text1 shadow-popover ring-1 ring-black/20 backdrop-blur-xl"
              buttonContentClassName="flex min-w-0 max-w-[160px] items-center gap-2 truncate"
              renderTriggerValue={(option) => (
                <span className="truncate text-text1">{option?.label ?? status.current_branch}</span>
              )}
              renderOptionLabel={(option, { isSelected }) => (
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate">{option.label}</span>
                  {option.key?.toString().startsWith('remote-') ? (
                    <Badge variant="warning">remote</Badge>
                  ) : (
                    isSelected && <Badge variant="info">current</Badge>
                  )}
                </div>
              )}
            />
          </div>

          {status.ahead > 0 && <Badge variant="success">↑ {status.ahead}</Badge>}

          {status.behind > 0 && <Badge variant="warning">↓ {status.behind}</Badge>}

          <Button onClick={() => setSettingsOpen(true)} variant="ghost" size="sm">
            Settings
          </Button>
        </div>
      )}
    </div>
  );
};
