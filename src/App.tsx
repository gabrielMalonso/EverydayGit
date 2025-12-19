import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TopBar } from './components/TopBar';
import { BranchesPanel } from './components/BranchesPanel';
import { ChangesListPanel } from './components/ChangesListPanel';
import { CommitPanel } from './components/CommitPanel';
import { DiffViewer } from './components/DiffViewer';
import { HistoryPanel } from './components/HistoryPanel';
import { SettingsModal } from './components/SettingsModal';
import { useRepoStore } from './stores/repoStore';
import { useConfig } from './hooks/useConfig';

const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

function App() {
  const { setRepoPath } = useRepoStore();
  const { loadConfig } = useConfig();

  useEffect(() => {
    if (!isTauri) return;

    const restoreLastRepo = async () => {
      try {
        const config = await loadConfig();
        if (config?.last_repo_path) {
          try {
            await invoke('set_repository', { path: config.last_repo_path });
            setRepoPath(config.last_repo_path);
          } catch (error) {
            console.warn('Último repositório não acessível:', error);
          }
        }
      } catch (error) {
        console.error('Falha ao restaurar último repositório:', error);
      }
    };

    restoreLastRepo();
  }, []);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg text-text1">
      <TopBar />

      <div className="flex min-h-0 flex-1 flex-col gap-4 px-6 pb-6 pt-4">
        <div className="mx-auto grid min-h-0 w-full max-w-7xl flex-1 grid-cols-3 gap-4">
          {/* Left 1/3 */}
          <div className="col-span-1 flex min-h-0 flex-col gap-4">
            <BranchesPanel className="min-h-0 flex-1" />
            <ChangesListPanel className="min-h-0 flex-1" />
            <HistoryPanel className="min-h-0 flex-1" />
          </div>

          {/* Right 2/3 */}
          <div className="col-span-2 flex min-h-0 flex-col gap-4">
            <CommitPanel />
            <DiffViewer className="min-h-0 flex-1" />
          </div>
        </div>
      </div>

      <SettingsModal />
    </div>
  );
}

export default App;
