import { useCallback } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

export const useTabMerge = () => {
  const tabId = useCurrentTabId();
  const { getTab, updateTabMerge } = useTabStore();

  const tab = getTab(tabId);
  const merge = tab?.merge ?? { isMergeInProgress: false, conflictCount: 0 };

  const setMergeInProgress = useCallback(
    (inProgress: boolean, count = 0) => {
      updateTabMerge(tabId, { isMergeInProgress: inProgress, conflictCount: inProgress ? count : 0 });
    },
    [tabId, updateTabMerge],
  );

  return {
    isMergeInProgress: merge.isMergeInProgress,
    conflictCount: merge.conflictCount,
    setMergeInProgress,
  };
};
