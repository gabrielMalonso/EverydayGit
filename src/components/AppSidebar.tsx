import React from 'react';
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
  SidebarTrigger,
} from '@/ui/Sidebar';
import { Tooltip } from '@/ui';
import { ChevronLeft, GitBranch, GitCommit, Clock, Settings, FolderGit2 } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSidebarStore } from '@/stores/sidebarStore';

const navItems = [
  { key: 'commits' as const, label: 'Commits', icon: <GitCommit size={18} /> },
  { key: 'branches' as const, label: 'Branches', icon: <GitBranch size={18} /> },
  { key: 'history' as const, label: 'History', icon: <Clock size={18} />, disabled: true },
];

export const AppSidebar: React.FC = () => {
  const { currentPage, setPage } = useNavigationStore();
  const { repoPath } = useRepoStore();
  const { setSettingsOpen } = useSettingsStore();
  const { collapsed, toggle } = useSidebarStore();

  const repoName = React.useMemo(() => {
    if (!repoPath) return 'Nenhum repositório selecionado';
    const parts = repoPath.split(/[\\/]/);
    return parts[parts.length - 1] || repoPath;
  }, [repoPath]);

  const renderNavItem = (item: (typeof navItems)[number]) => {
    const content = (
      <SidebarItem
        key={item.key}
        icon={item.icon}
        active={currentPage === item.key}
        disabled={item.disabled}
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

  const settingsItem = (
    <SidebarItem icon={<Settings size={18} />} onClick={() => setSettingsOpen(true)}>
      Settings
    </SidebarItem>
  );

  return (
    <SidebarProvider collapsed={collapsed}>
      <Sidebar>
        <SidebarHeader className={`relative ${collapsed ? 'justify-center' : 'pl-14 pr-3'}`}>
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <GitBranch size={18} />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold text-text1">GitFlow AI</div>
                <div className="text-xs text-text3">flow assistido</div>
              </div>
            </div>
          )}

          <Tooltip content={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'} position="right">
            <SidebarTrigger
              onClick={toggle}
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
              className="absolute left-3 top-1/2 -translate-y-1/2"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </SidebarTrigger>
          </Tooltip>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup label="Navegação">{navItems.map(renderNavItem)}</SidebarGroup>

          <SidebarGroup label="Ajustes">
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
