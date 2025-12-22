import React from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarItem,
  SidebarGroup,
} from '@/ui/Sidebar';
import { GitBranch, GitCommit, Clock, Settings, FolderGit2 } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import { useRepoStore } from '@/stores/repoStore';
import { useSettingsStore } from '@/stores/settingsStore';

const navItems = [
  { key: 'commits' as const, label: 'Commits', icon: <GitCommit size={18} /> },
  { key: 'branches' as const, label: 'Branches', icon: <GitBranch size={18} /> },
  { key: 'history' as const, label: 'History', icon: <Clock size={18} />, disabled: true },
];

export const AppSidebar: React.FC = () => {
  const { currentPage, setPage } = useNavigationStore();
  const { repoPath } = useRepoStore();
  const { setSettingsOpen } = useSettingsStore();

  const repoName = React.useMemo(() => {
    if (!repoPath) return 'Nenhum repositório selecionado';
    const parts = repoPath.split(/[\\/]/);
    return parts[parts.length - 1] || repoPath;
  }, [repoPath]);

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <GitBranch size={18} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-text1">GitFlow AI</div>
            <div className="text-xs text-text3">flow assistido</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup label="Navegação">
          {navItems.map((item) => (
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
          ))}
        </SidebarGroup>

        <SidebarGroup label="Ajustes">
          <SidebarItem icon={<Settings size={18} />} onClick={() => setSettingsOpen(true)}>
            Settings
          </SidebarItem>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2 text-xs text-text2">
          <FolderGit2 size={16} className="text-text3" />
          <div className="flex-1 truncate" title={repoPath || undefined}>
            {repoName}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};
