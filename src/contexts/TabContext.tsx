import { createContext, useContext, type ReactNode } from 'react';

interface TabContextValue {
  tabId: string;
}

const TabContext = createContext<TabContextValue | null>(null);

interface TabProviderProps {
  tabId: string;
  children: ReactNode;
}

export const TabProvider = ({ tabId, children }: TabProviderProps) => {
  return <TabContext.Provider value={{ tabId }}>{children}</TabContext.Provider>;
};

export const useTabContext = () => {
  const context = useContext(TabContext);
  if (!context) {
    throw new Error('useTabContext must be used within a TabProvider');
  }
  return context;
};

export const useCurrentTabId = () => useTabContext().tabId;
