import { getCurrentWindow } from '@tauri-apps/api/window';

let cachedLabel: string | null = null;

export const getWindowLabel = () => {
  if (cachedLabel) return cachedLabel;

  try {
    cachedLabel = getCurrentWindow().label;
  } catch {
    cachedLabel = 'main';
  }

  return cachedLabel;
};
