import { useCallback, useMemo } from 'react';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';

export const useTabMerge = () => {
  const tabId = useCurrentTabId();
  const getTab = useTabStore((s) => s.getTab);
  const updateTabMerge = useTabStore((s) => s.updateTabMerge);

  const tab = getTab(tabId);
  const merge = tab?.merge ?? { isMergeInProgress: false, conflictCount: 0 };

  const setMergeInProgress = useCallback(
    (inProgress: boolean, count = 0) => {
      updateTabMerge(tabId, { isMergeInProgress: inProgress, conflictCount: inProgress ? count : 0 });
    },
    [tabId, updateTabMerge],
  );

  return useMemo(
    () => ({
      isMergeInProgress: merge.isMergeInProgress,
      conflictCount: merge.conflictCount,
      setMergeInProgress,
    }),
    [merge.isMergeInProgress, merge.conflictCount, setMergeInProgress],
  );
};
