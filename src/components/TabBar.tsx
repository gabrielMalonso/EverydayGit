import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Plus } from 'lucide-react';
import { useTabStore, useTabs, useActiveTabId } from '@/stores/tabStore';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';
import { isTauriRuntime } from '@/demo/demoMode';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import logoMark from '../assets/logo-mark.png';

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
    <header className="flex h-10 items-center border-b border-border1 bg-surface2 px-3">
      {/* Logo + Title */}
      <div className="flex items-center gap-2 pr-4 border-r border-border2 mr-2">
        <img src={logoMark} alt="" className="h-5 w-5 opacity-90" draggable={false} />
        <span className="text-xs font-medium text-text1 opacity-90">EverydayGit</span>
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
              delay={500}
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

                {hasChanges && <div className="h-2 w-2 rounded-full bg-warning" />}

                <span className="flex-1 truncate text-left font-medium">{tab.title}</span>

                <button
                  type="button"
                  onClick={(event) => handleCloseTab(tab.tabId, event)}
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded transition-all',
                    'opacity-0 group-hover:opacity-100',
                    'hover:bg-surface3 hover:text-danger',
                  )}
                  aria-label="Fechar aba"
                >
                  <X size={14} />
                </button>
              </div>
            </Tooltip>
          );
        })}
      </div>

      <Tooltip content="Nova aba (Cmd+T)" position="bottom">
        <button
          onClick={handleNewTab}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
            'text-text2 hover:bg-surface3 hover:text-text1',
          )}
          aria-label="Nova aba"
        >
          <Plus size={18} />
        </button>
      </Tooltip>
    </header>
  );
};
