import React, { startTransition, useLayoutEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useTabStore, useTabs, useActiveTabId, useTabOrder } from '@/stores/tabStore';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';
import { isTauriRuntime } from '@/demo/demoMode';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import logoMark from '../assets/logo-mark.png';
import { BranchControls } from './BranchControls';

export const TabBar: React.FC = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const tabOrderLength = useTabOrder().length;
  // Use individual selectors for stable method references
  const createTab = useTabStore((s) => s.createTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const tabOrder = useTabOrder(); // Already uses selector
  const prefersReducedMotion = useReducedMotion();

  // Refs for measuring tab positions
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const tabRefs = React.useRef<Map<string, HTMLDivElement | null>>(new Map());
  const [indicator, setIndicator] = React.useState<{ x: number; width: number } | null>(null);

  // Update indicator position when active tab changes
  const updateIndicator = React.useCallback(() => {
    if (import.meta.env.DEV) {
      console.log('[TabBar] updateIndicator called, activeTabId:', activeTabId);
    }
    if (!activeTabId) {
      setIndicator(null);
      return;
    }
    const container = containerRef.current;
    const activeTab = tabRefs.current.get(activeTabId);
    if (!container || !activeTab) {
      if (import.meta.env.DEV) {
        console.log('[TabBar] Container or activeTab not found');
      }
      setIndicator(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    // Calculate position relative to container, with 8px padding on each side
    const newIndicator = {
      x: tabRect.left - containerRect.left + 8,
      width: tabRect.width - 16,
    };
    if (import.meta.env.DEV) {
      console.log('[TabBar] Setting indicator:', newIndicator);
    }
    setIndicator(newIndicator);
  }, [activeTabId]);

  // Ref pattern to avoid stale closure in ResizeObserver
  const updateIndicatorRef = useRef(updateIndicator);
  useLayoutEffect(() => {
    updateIndicatorRef.current = updateIndicator;
  });

  // Update on activeTabId or tabs count change (primitive for stability)
  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, tabOrderLength, activeTabId]);

  // ResizeObserver with stable callback to prevent loop
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => updateIndicatorRef.current());
    observer.observe(container);

    const activeTab = activeTabId ? tabRefs.current.get(activeTabId) : null;
    if (activeTab) observer.observe(activeTab);

    return () => observer.disconnect();
  }, [activeTabId]); // Removed updateIndicator from deps - using ref instead

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
    <header className="flex h-14 items-center border-b border-border1 bg-surface1/95 backdrop-blur px-4 overflow-hidden">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 pr-5 border-r border-surface3 mr-3">
        <img src={logoMark} alt="" className="h-8 w-8" draggable={false} />
        <span className="text-lg font-semibold text-text1">EverydayGit</span>
      </div>

      <div ref={containerRef} className="relative flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none">
        {/* Animated indicator bar */}
        {indicator && (
          <motion.div
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-primary z-20 will-change-transform"
            initial={false}
            animate={{
              x: indicator.x,
              width: indicator.width,
            }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
          />
        )}

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
                ref={(node) => {
                  tabRefs.current.set(tab.tabId, node);
                }}
                role="button"
                tabIndex={0}
                onClick={() => {
                  if (import.meta.env.DEV) {
                    console.log('[TabBar] Tab clicked:', tab.tabId, 'at', performance.now().toFixed(2));
                  }
                  startTransition(() => setActiveTab(tab.tabId));
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (import.meta.env.DEV) {
                      console.log('[TabBar] Tab Enter:', tab.tabId);
                    }
                    startTransition(() => setActiveTab(tab.tabId));
                  }
                }}
                className={cn(
                  'group relative flex h-8 min-w-[140px] max-w-[220px] cursor-pointer items-center gap-2 rounded-t-lg px-3 text-sm transition-all',
                  isActive
                    ? 'bg-surface1 text-text1'
                    : 'text-text2 hover:bg-surface3/50 hover:text-text1',
                )}
              >
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
