import { useCallback, useMemo } from 'react';
import { useTabStore, type TabPage } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

export const useTabNavigation = () => {
  const tabId = useCurrentTabId();
  const { updateTabNavigation } = useTabStore();

  // Use a single selector for tab data to maintain stable hook order
  const tab = useTabStore((state) => state.tabs[tabId]);
  const currentPage = tab?.navigation.currentPage ?? 'commits';

  const setPage = useCallback(
    (page: TabPage) => {
      updateTabNavigation(tabId, page);
    },
    [tabId, updateTabNavigation],
  );

  return useMemo(() => ({
    currentPage,
    setPage,
  }), [currentPage, setPage]);
};
