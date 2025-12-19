import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { Button } from './Button';
import { Badge } from './Badge';
import { useRepoStore } from '../stores/repoStore';
import { useGitStore } from '../stores/gitStore';
import { useSettingsStore } from '../stores/settingsStore';

export const TopBar: React.FC = () => {
  const { repoPath, setRepoPath } = useRepoStore();
  const { status } = useGitStore();
  const { setSettingsOpen } = useSettingsStore();

  const handleSelectRepo = async () => {
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
    <div className="h-14 bg-bg-secondary border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-bold text-text-primary">GitFlow AI</h1>
        {!repoPath ? (
          <Button onClick={handleSelectRepo} size="sm">
            Open Repository
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">
              {repoPath.split('/').pop()}
            </span>
            <Button onClick={handleSelectRepo} variant="ghost" size="sm">
              Change
            </Button>
          </div>
        )}
      </div>

      {status && (
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary">Branch:</span>
            <Badge variant="info">{status.current_branch}</Badge>
          </div>

          {status.ahead > 0 && (
            <Badge variant="success">↑ {status.ahead}</Badge>
          )}

          {status.behind > 0 && (
            <Badge variant="warning">↓ {status.behind}</Badge>
          )}

          <Button onClick={() => setSettingsOpen(true)} variant="ghost" size="sm">
            Settings
          </Button>
        </div>
      )}
    </div>
  );
};
