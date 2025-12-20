import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui';
import { Badge } from './Badge';
import { useRepoStore } from '../stores/repoStore';
import { useGitStore } from '../stores/gitStore';
import { useSettingsStore } from '../stores/settingsStore';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, setRepoPath } = useRepoStore();
  const { status } = useGitStore();
  const { setSettingsOpen } = useSettingsStore();

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
    <div className="h-14 bg-surface1/90 backdrop-blur border-b border-border1 shadow-subtle flex items-center justify-between px-5">
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
            <Badge variant="info">{status.current_branch}</Badge>
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
