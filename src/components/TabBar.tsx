import React, { startTransition, useLayoutEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { useTabStore, useTabs, useActiveTabId, useTabOrder, type TabState, type TabColor } from '@/stores/tabStore';
import { Tooltip } from '@/ui';
import { cn } from '@/lib/utils';
import { isTauriRuntime } from '@/demo/demoMode';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import logoMark from '../assets/logo-mark.png';
import { BranchControls } from './BranchControls';
import { TabContextMenu } from './TabContextMenu';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableTabProps {
  tab: TabState;
  isActive: boolean;
  onTabClick: () => void;
  onClose: (event: React.MouseEvent) => void;
  onRename: () => void;
  onCloseOthers: () => void;
  onColorChange: (color: TabColor) => void;
  tabRef: (node: HTMLDivElement | null) => void;
}

// Color mapping helper
const getColorClass = (color: TabColor): string => {
  const colorMap: Record<TabColor, string> = {
    default: 'rgb(133 204 35)',
    blue: 'rgb(59 130 246)',
    purple: 'rgb(168 85 247)',
    pink: 'rgb(236 72 153)',
    orange: 'rgb(245 158 11)',
    red: 'rgb(239 68 68)',
    yellow: 'rgb(234 179 8)',
    cyan: 'rgb(6 182 212)',
  };
  return colorMap[color];
};

const SortableTab: React.FC<SortableTabProps> = ({
  tab,
  isActive,
  onTabClick,
  onClose,
  onRename,
  onCloseOthers,
  onColorChange,
  tabRef
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.tabId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const hasChanges = Boolean(tab.git?.status?.files?.length);
  const tabColor = getColorClass(tab.color);

  return (
    <TabContextMenu
      tab={tab}
      onRename={onRename}
      onClose={() => onClose({} as React.MouseEvent)}
      onCloseOthers={onCloseOthers}
      onColorChange={onColorChange}
    >
      <Tooltip
        content={tab.repoPath || 'Nova Aba'}
        position="bottom"
        delay={1000}
      >
        <div
          ref={(node) => {
            setNodeRef(node);
            tabRef(node);
          }}
          style={style}
          {...attributes}
          {...listeners}
          role="button"
          tabIndex={0}
          onClick={onTabClick}
          onDoubleClick={(e) => {
            // Prevent double-click on tabs from creating a new tab
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            // Middle-click to close (button 1 = middle button)
            if (e.button === 1) {
              onClose(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onTabClick();
            }
          }}
          className={cn(
            'group relative flex h-8 min-w-[140px] max-w-[220px] items-center gap-2 rounded-t-lg px-3 text-sm transition-all select-none',
            isActive
              ? 'bg-surface1 text-text1'
              : 'text-text2 hover:bg-surface3/50 hover:text-text1',
          )}
        >
          {hasChanges && (
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: tabColor }}
            />
          )}
          <span className="flex-1 truncate text-left font-medium">{tab.title}</span>

          <button
            type="button"
            onClick={onClose}
            onMouseDown={(e) => {
              // Stop propagation to prevent drag when clicking X
              e.stopPropagation();
            }}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded transition-all',
              'text-text2 opacity-40 group-hover:opacity-100 group-hover:text-text1 focus-visible:opacity-100',
              'hover:bg-surface3',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
            )}
            style={{
              ['--hover-color' as any]: tabColor,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = tabColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = '';
            }}
            aria-label="Fechar aba"
          >
            <X size={16} />
          </button>
        </div>
      </Tooltip>
    </TabContextMenu>
  );
};

export const TabBar: React.FC = () => {
  const tabs = useTabs();
  const activeTabId = useActiveTabId();
  const tabOrderLength = useTabOrder().length;
  // Use individual selectors for stable method references
  const createTab = useTabStore((s) => s.createTab);
  const closeTab = useTabStore((s) => s.closeTab);
  const setActiveTab = useTabStore((s) => s.setActiveTab);
  const reorderTabs = useTabStore((s) => s.reorderTabs);
  const setTabColor = useTabStore((s) => s.setTabColor);
  const setTabTitle = useTabStore((s) => s.setTabTitle);
  const tabOrder = useTabOrder(); // Already uses selector
  const prefersReducedMotion = useReducedMotion();

  // Drag & drop state
  const [activeId, setActiveId] = React.useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement before initiating drag (prevents accidental drags)
      },
    })
  );

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

  const handleContainerDoubleClick = (e: React.MouseEvent) => {
    // Verifica se o alvo do clique é o próprio container ou o espaço vazio
    // Não executa se clicou em uma aba ou em outros elementos filhos
    const target = e.target as HTMLElement;
    const container = containerRef.current;

    if (!container) return;

    // Se o clique foi diretamente no container (espaço vazio)
    if (target === container) {
      handleNewTab();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = tabOrder.indexOf(active.id as string);
      const newIndex = tabOrder.indexOf(over.id as string);
      reorderTabs(oldIndex, newIndex);
    }

    setActiveId(null);

    // Update indicator after DOM settles
    requestAnimationFrame(() => {
      updateIndicator();
    });
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

  const handleRenameTab = (tabId: string, currentTitle: string) => {
    const newTitle = prompt('Novo nome da aba:', currentTitle);
    if (newTitle && newTitle.trim()) {
      setTabTitle(tabId, newTitle.trim());
    }
  };

  const handleCloseOthers = (tabId: string) => {
    const otherTabs = tabOrder.filter(id => id !== tabId);
    otherTabs.forEach(id => {
      if (isTauriRuntime()) {
        const contextKey = `${getWindowLabel()}:${id}`;
        void invoke('unset_tab_repository', { contextKey }).catch((error) =>
          console.error('Failed to clear tab repository:', error),
        );
      }
      closeTab(id);
    });
  };

  // Local component to avoid hook issues with DragOverlay portal
  const DragOverlayTab: React.FC<{ tab: TabState }> = ({ tab }) => {
    const hasChanges = Boolean(tab.git?.status?.files?.length);
    const tabColor = getColorClass(tab.color);

    return (
      <div className="flex h-8 min-w-[140px] max-w-[220px] items-center gap-2 rounded-t-lg px-3 text-sm bg-surface1 text-text1 shadow-lg opacity-80 cursor-grabbing border border-primary/50">
        {hasChanges && (
          <div
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: tabColor }}
          />
        )}
        <span className="flex-1 truncate text-left font-medium">{tab.title}</span>
      </div>
    );
  };

  // Find active tab for drag overlay and indicator color
  const activeTab = activeId ? tabs.find(t => t.tabId === activeId) : null;
  const activeTabData = tabs.find(t => t.tabId === activeTabId);
  const activeTabColor = activeTabData ? getColorClass(activeTabData.color) : 'rgb(133 204 35)';

  return (
    <header className="flex h-16 min-h-0 items-center border-b border-border1 bg-surface1/95 backdrop-blur px-4 overflow-hidden overflow-y-hidden">
      {/* Logo + Title */}
      <div className="flex items-center gap-3 pr-5 border-r border-surface3 mr-3">
        <img src={logoMark} alt="" className="h-8 w-8" draggable={false} />
        <span className="text-lg font-semibold text-text1">EverydayGit</span>
      </div>

      <div
        ref={containerRef}
        onDoubleClick={handleContainerDoubleClick}
        className="relative flex flex-1 items-center gap-1 overflow-x-auto scrollbar-none cursor-default"
      >
        {/* Animated indicator bar - hide during drag */}
        {indicator && !activeId && (
          <motion.div
            className="pointer-events-none absolute bottom-0 h-0.5 rounded-full z-20 will-change-transform"
            style={{ backgroundColor: activeTabColor }}
            initial={false}
            animate={{
              x: indicator.x,
              width: indicator.width,
            }}
            transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 35 }}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={tabOrder} strategy={horizontalListSortingStrategy}>
            {tabs.map((tab) => {
              const isActive = tab.tabId === activeTabId;

              return (
                <SortableTab
                  key={tab.tabId}
                  tab={tab}
                  isActive={isActive}
                  onTabClick={() => {
                    if (import.meta.env.DEV) {
                      console.log('[TabBar] Tab clicked:', tab.tabId, 'at', performance.now().toFixed(2));
                    }
                    startTransition(() => setActiveTab(tab.tabId));
                  }}
                  onClose={(event) => handleCloseTab(tab.tabId, event)}
                  onRename={() => handleRenameTab(tab.tabId, tab.title)}
                  onCloseOthers={() => handleCloseOthers(tab.tabId)}
                  onColorChange={(color) => setTabColor(tab.tabId, color)}
                  tabRef={(node) => {
                    tabRefs.current.set(tab.tabId, node);
                  }}
                />
              );
            })}
          </SortableContext>

          <DragOverlay>
            {activeTab ? <DragOverlayTab tab={activeTab} /> : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* New Tab button - OUTSIDE scrollable container */}
      <Tooltip content="Nova aba (Cmd+T)" position="bottom">
        <button
          onClick={handleNewTab}
          className={cn(
            'flex h-7 w-7 items-center justify-center rounded transition-colors shrink-0 ml-1',
            'text-text2 hover:bg-surface3 hover:text-text1',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
          )}
          aria-label="Nova aba"
        >
          <Plus size={16} />
        </button>
      </Tooltip>

      {/* Branch selector + Settings */}
      <BranchControls />
    </header>
  );
};
