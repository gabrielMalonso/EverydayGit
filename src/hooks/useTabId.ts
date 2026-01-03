import { getWindowLabel } from './useWindowLabel';
import { useCurrentTabId } from '@/contexts/TabContext';

export const getContextKey = (windowLabel: string, tabId: string): string => {
  return `${windowLabel}:${tabId}`;
};

export const useContextKey = (): string => {
  const tabId = useCurrentTabId();
  const windowLabel = getWindowLabel();
  return getContextKey(windowLabel, tabId);
};
