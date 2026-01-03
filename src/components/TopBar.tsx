import React from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { Button } from '../ui';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

const isTauriRuntime = () => {
  if (typeof window === 'undefined') return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

export const TopBar: React.FC = () => {
  const { repoPath, setRepository } = useTabRepo();
  const { setPage } = useTabNavigation();
  const resetTabGit = useTabStore((s) => s.resetTabGit);
  const tabId = useCurrentTabId();

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
    <div className="relative z-40 h-12 bg-surface1/90 backdrop-blur border-b border-border1 shadow-subtle flex items-center px-5">
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
    </div>
  );
};
