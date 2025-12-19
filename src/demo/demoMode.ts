const isBrowser = typeof window !== 'undefined';

const getQueryFlag = (name: string) => {
  if (!isBrowser) return null;
  try {
    const value = new URLSearchParams(window.location.search).get(name);
    return value;
  } catch {
    return null;
  }
};

export const isDemoMode = () => {
  const envFlag = (import.meta as any)?.env?.VITE_DEMO;
  if (envFlag === '1' || envFlag === 'true') return true;

  const queryFlag = getQueryFlag('demo');
  if (!queryFlag) return false;
  return queryFlag === '1' || queryFlag === 'true';
};

export const isTauriRuntime = () => {
  if (!isBrowser) return false;
  const w = window as any;
  return Boolean(w.__TAURI__ || w.__TAURI_METADATA__ || w.__TAURI_INTERNALS__ || w.__TAURI_IPC__);
};

