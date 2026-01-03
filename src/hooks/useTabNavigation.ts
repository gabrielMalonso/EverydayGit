import { useCallback } from 'react';
import { useTabStore, type TabPage } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

export const useTabNavigation = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTabNavigation } = useTabStore();

  const tab = getTab(tabId);
  const currentPage = tab?.navigation.currentPage ?? 'commits';

  const setPage = useCallback(
    (page: TabPage) => {
      updateTabNavigation(tabId, page);
    },
    [tabId, updateTabNavigation],
  );

  return {
    currentPage,
    setPage,
  };
};
