import React from 'react';
import { AppSidebar } from './AppSidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-bg text-text1">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex-1 overflow-auto px-6 pb-6 pt-4">
          <div className="mx-auto h-full w-full max-w-7xl">{children}</div>
        </div>
      </div>
    </div>
  );
};
