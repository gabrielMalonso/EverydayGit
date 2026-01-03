import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Plus } from 'lucide-react';
import { useTabStore, useTabs, useActiveTabId } from '@/stores/tabStore';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';
import { isTauriRuntime } from '@/demo/demoMode';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import logoMark from '../assets/logo-mark.png';
import { BranchControls } from './BranchControls';

export const TabBar: React.FC = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const { createTab, closeTab, setActiveTab, tabOrder } = useTabStore();

  const handleNewTab = () => {
    createTab(null);
  };

  const handleCloseTab = (tabId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (isTauriRuntime()) {
      const contextKey = `${getWindowLabel()}:${tabId}`;
      void invoke('unset_tab_repository', { contextKey }).catch((error) =>
        console.error('Failed to clear tab repository:', error),
      );
    }

    if (tabOrder.length === 1) {
      window.close();
      return;
    }

    closeTab(tabId);
  };

  return (
    <header className="flex h-14 items-center border-b border-border1 bg-surface1/95 backdrop-blur px-4">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 pr-5 border-r border-surface3 mr-3">
        <img src={logoMark} alt="" className="h-8 w-8" draggable={false} />
        <span className="text-lg font-semibold text-text1">EverydayGit</span>
      </div>

      <div className="flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {tabs.map((tab) => {
          const isActive = tab.tabId === activeTabId;
          const hasChanges = Boolean(tab.git?.status?.files?.length);

          return (
            <Tooltip
              key={tab.tabId}
              content={tab.repoPath || 'Nova Aba'}
              position="bottom"
              delay={1000}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab(tab.tabId)}
                onKeyDown={(e) => e.key === 'Enter' && setActiveTab(tab.tabId)}
                className={cn(
                  'group relative flex h-8 min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 rounded-t-lg px-3 text-sm transition-all',
                  isActive
                    ? 'bg-surface1 text-text1'
                    : 'text-text2 hover:bg-surface3/50 hover:text-text1',
                )}
              >
                {isActive && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary" />
                )}

                {hasChanges && <div className="h-2 w-2 rounded-full bg-primary" />}

                <span className="flex-1 truncate text-left font-medium">{tab.title}</span>

                <button
                  type="button"
                  onClick={(event) => handleCloseTab(tab.tabId, event)}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded transition-all',
                    'text-text2 opacity-40 group-hover:opacity-100 group-hover:text-text1 focus-visible:opacity-100',
                    'hover:bg-surface3 hover:text-primary',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  )}
                  aria-label="Fechar aba"
                >
                  <X size={40} />
                </button>
              </div>
            </Tooltip>
          );
        })}

        <Tooltip content="Nova aba (Cmd+T)" position="bottom">
          <button
            onClick={handleNewTab}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded transition-colors shrink-0',
              'text-text2 hover:bg-surface3 hover:text-text1',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
            aria-label="Nova aba"
          >
            <Plus size={16} />
          </button>
        </Tooltip>
      </div>

      {/* Branch selector + Settings */}
      <BranchControls />
    </header>
  );
};
