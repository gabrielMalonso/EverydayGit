import React from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { SidebarInset } from '@/ui/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-bg text-text1">
      <AppSidebar />
      <SidebarInset>
        <TabBar />
        <TopBar />
        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          <div className="h-full w-full min-w-0">{children}</div>
        </div>
      </SidebarInset>
    </div>
  );
};
