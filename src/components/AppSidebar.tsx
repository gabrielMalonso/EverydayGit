import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  Sidebar,
  SidebarProvider,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
  SidebarTrigger,
} from '@/ui/Sidebar';
import { Tooltip } from '@/ui';
import { ChevronLeft, GitBranch, GitCommit, Clock, Settings, FolderGit2, GitMerge, KeyRound } from 'lucide-react';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useTabMerge } from '@/hooks/useTabMerge';
import { useTabGit } from '@/hooks/useTabGit';

type NavItem = {
  key: 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup';
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  endAdornment?: React.ReactNode;
};

type AnimatedSidebarListProps = {
  items: NavItem[];
  activeKey?: NavItem['key'];
  collapsed: boolean;
  onSelect: (key: NavItem['key']) => void;
};

const SIDEBAR_TOOLTIP_DELAY = 1000;

const AnimatedSidebarList: React.FC<AnimatedSidebarListProps> = ({ items, activeKey, collapsed, onSelect }) => {
  const prefersReducedMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const itemRefs = React.useRef<Map<string, HTMLButtonElement | null>>(new Map());
  const [indicator, setIndicator] = React.useState<{ x: number; y: number; width: number; height: number } | null>(
    null,
  );

  const updateIndicator = React.useCallback(() => {
    if (!activeKey) {
      setIndicator(null);
      return;
    }
    const container = containerRef.current;
    const activeButton = itemRefs.current.get(activeKey);
    if (!container || !activeButton) {
      setIndicator(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    setIndicator({
      x: buttonRect.left - containerRect.left,
      y: buttonRect.top - containerRect.top,
      width: buttonRect.width,
      height: buttonRect.height,
    });
  }, [activeKey]);

  React.useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator, items]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => updateIndicator());
    observer.observe(container);

    const activeButton = activeKey ? itemRefs.current.get(activeKey) : null;
    if (activeButton) observer.observe(activeButton);

    return () => observer.disconnect();
  }, [activeKey, updateIndicator]);

  React.useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts?.ready) return;
    document.fonts.ready.then(updateIndicator).catch(() => undefined);
  }, [updateIndicator]);

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      {indicator && (
        <motion.div
          className="pointer-events-none absolute left-0 top-0 rounded-md bg-primary/15 shadow-[inset_2px_0_0_0_rgba(var(--color-primary),0.8)]"
          initial={false}
          animate={{
            x: indicator.x,
            y: indicator.y,
            width: indicator.width,
            height: indicator.height,
          }}
          transition={prefersReducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 500, damping: 36 }}
        />
      )}

      {items.map((item) => {
        const content = (
          <SidebarItem
            ref={(node) => {
              itemRefs.current.set(item.key, node);
            }}
            key={item.key}
            icon={item.icon}
            active={activeKey === item.key}
            activeStyle="none"
            disabled={item.disabled}
            endAdornment={item.endAdornment}
            onClick={() => !item.disabled && onSelect(item.key)}
            className={item.disabled ? 'opacity-60 relative z-10' : 'relative z-10'}
          >
            {item.label}
          </SidebarItem>
        );

        if (!collapsed) return content;

        return (
          <Tooltip key={item.key} content={item.label} position="right" delay={SIDEBAR_TOOLTIP_DELAY}>
            {content}
          </Tooltip>
        );
      })}
    </div>
  );
};

const baseNavItems: NavItem[] = [
  { key: 'commits' as const, label: 'Commits', icon: <GitCommit size={18} /> },
  { key: 'branches' as const, label: 'Branches', icon: <GitBranch size={18} /> },
];

const historyItem: NavItem = {
  key: 'history',
  label: 'History',
  icon: <Clock size={18} />,
  disabled: true,
};

export const AppSidebar: React.FC = () => {
  const { currentPage, setPage } = useTabNavigation();
  const { repoPath, repoState } = useTabRepo();
  const { setSettingsOpen } = useSettingsStore();
  const { collapsed, toggle } = useSidebarStore();
  const { isMergeInProgress, conflictCount, setMergeInProgress } = useTabMerge();
  const { checkMergeInProgress } = useTabGit();

  const repoName = React.useMemo(() => {
    if (!repoPath) return 'Nenhum repositório selecionado';
    const parts = repoPath.split(/[\\/]/);
    return parts[parts.length - 1] || repoPath;
  }, [repoPath]);

  React.useEffect(() => {
    let isActive = true;

    const refreshMergeStatus = async () => {
      if (!repoPath || repoState !== 'git') {
        setMergeInProgress(false, 0);
        return;
      }

      try {
        const result = await checkMergeInProgress();
        if (!isActive) return;
        setMergeInProgress(result.inProgress, result.conflicts.length);
      } catch (error) {
        console.error('Failed to check merge status:', error);
        if (isActive) setMergeInProgress(false, 0);
      }
    };

    refreshMergeStatus();

    return () => {
      isActive = false;
    };
  }, [repoPath, repoState, checkMergeInProgress, setMergeInProgress]);

  const conflictItem = React.useMemo<NavItem | null>(() => {
    if (!isMergeInProgress) return null;

    const badge =
      conflictCount > 0 ? (
        <span className="ml-auto rounded-full bg-danger px-2 py-0.5 text-xs text-white">
          {conflictCount}
        </span>
      ) : null;

    return {
      key: 'conflict-resolver' as const,
      label: 'Conflitos',
      icon: <GitMerge size={18} />,
      endAdornment: badge,
    };
  }, [conflictCount, isMergeInProgress]);

  const navItems = React.useMemo<NavItem[]>(() => {
    const items = [...baseNavItems];
    if (conflictItem) items.push(conflictItem);
    items.push(historyItem);
    return items;
  }, [conflictItem]);

  const activeNavKey = React.useMemo<NavItem['key'] | undefined>(() => {
    return navItems.find((item) => item.key === currentPage)?.key;
  }, [currentPage, navItems]);

  const settingsItem = (
    <SidebarItem icon={<Settings size={18} />} onClick={() => setSettingsOpen(true)}>
      Settings
    </SidebarItem>
  );

  return (
    <SidebarProvider collapsed={collapsed}>
      <Sidebar className="relative">
        <SidebarContent>
          <SidebarGroup label="Navegação">
            <AnimatedSidebarList
              items={navItems}
              activeKey={activeNavKey}
              collapsed={collapsed}
              onSelect={setPage}
            />
          </SidebarGroup>

          <SidebarGroup label="Ajustes">
            <AnimatedSidebarList
              items={[{ key: 'setup', label: 'Autenticação', icon: <KeyRound size={18} /> }]}
              activeKey={currentPage === 'setup' ? 'setup' : undefined}
              collapsed={collapsed}
              onSelect={() => setPage('setup')}
            />
            {collapsed ? (
              <Tooltip content="Settings" position="right" delay={SIDEBAR_TOOLTIP_DELAY}>
                {settingsItem}
              </Tooltip>
            ) : (
              settingsItem
            )}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <div className="flex items-center gap-2">
            <Tooltip
              content={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              position="right"
              delay={SIDEBAR_TOOLTIP_DELAY}
            >
              <SidebarTrigger
                onClick={toggle}
                aria-expanded={!collapsed}
                aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              >
                <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
              </SidebarTrigger>
            </Tooltip>

            {!collapsed && (
              <div className="flex flex-1 items-center gap-2 text-xs text-text2 overflow-hidden">
                <FolderGit2 size={16} className="text-text3 shrink-0" />
                <div className="flex-1 truncate" title={repoPath || undefined}>
                  {repoName}
                </div>
              </div>
            )}
          </div>
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};
