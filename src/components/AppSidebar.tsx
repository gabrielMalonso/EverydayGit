import React from 'react';
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
import { useNavigationStore } from '@/stores/navigationStore';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useMergeStore } from '@/stores/mergeStore';
import { useGit } from '@/hooks/useGit';

type NavItem = {
  key: 'commits' | 'branches' | 'history' | 'conflict-resolver' | 'setup';
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  endAdornment?: React.ReactNode;
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
  const { currentPage, setPage } = useNavigationStore();
  const { repoPath } = useRepoStore();
  const { setSettingsOpen } = useSettingsStore();
  const { collapsed, toggle } = useSidebarStore();
  const { isMergeInProgress, conflictCount, setMergeInProgress } = useMergeStore();
  const { checkMergeInProgress } = useGit();

  const repoName = React.useMemo(() => {
    if (!repoPath) return 'Nenhum repositório selecionado';
    const parts = repoPath.split(/[\\/]/);
    return parts[parts.length - 1] || repoPath;
  }, [repoPath]);

  React.useEffect(() => {
    let isActive = true;

    const refreshMergeStatus = async () => {
      if (!repoPath) {
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
  }, [repoPath, checkMergeInProgress, setMergeInProgress]);

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

  const renderNavItem = (item: NavItem) => {
    const content = (
      <SidebarItem
        key={item.key}
        icon={item.icon}
        active={currentPage === item.key}
        disabled={item.disabled}
        endAdornment={item.endAdornment}
        onClick={() => !item.disabled && setPage(item.key)}
        className={item.disabled ? 'opacity-60' : undefined}
      >
        {item.label}
      </SidebarItem>
    );

    if (!collapsed) return content;

    return (
      <Tooltip key={item.key} content={item.label} position="right">
        {content}
      </Tooltip>
    );
  };

  const authItem = (
    <SidebarItem
      icon={<KeyRound size={18} />}
      active={currentPage === 'setup'}
      onClick={() => setPage('setup')}
    >
      Autenticação
    </SidebarItem>
  );

  const settingsItem = (
    <SidebarItem icon={<Settings size={18} />} onClick={() => setSettingsOpen(true)}>
      Settings
    </SidebarItem>
  );

  return (
    <SidebarProvider collapsed={collapsed}>
      <Sidebar className="relative">
        <Tooltip content={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'} position="right">
          <SidebarTrigger
            onClick={toggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
            className="absolute left-3 top-3 z-10"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </SidebarTrigger>
        </Tooltip>

        <SidebarContent className="pt-14">
          <SidebarGroup label="Navegação">{navItems.map(renderNavItem)}</SidebarGroup>

          <SidebarGroup label="Ajustes">
            {collapsed ? (
              <Tooltip content="Autenticação" position="right">
                {authItem}
              </Tooltip>
            ) : (
              authItem
            )}
            {collapsed ? (
              <Tooltip content="Settings" position="right">
                {settingsItem}
              </Tooltip>
            ) : (
              settingsItem
            )}
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          {collapsed ? (
            <Tooltip content={repoName} position="right">
              <div className="flex items-center justify-center text-xs text-text2">
                <FolderGit2 size={16} className="text-text3" />
              </div>
            </Tooltip>
          ) : (
            <div className="flex items-center gap-2 text-xs text-text2">
              <FolderGit2 size={16} className="text-text3" />
              <div className="flex-1 truncate" title={repoPath || undefined}>
                {repoName}
              </div>
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </SidebarProvider>
  );
};
