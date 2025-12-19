import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { TopBar } from './components/TopBar';
import { BranchesPanel } from './components/BranchesPanel';
import { ChangesPanel } from './components/ChangesPanel';
import { DiffViewer } from './components/DiffViewer';
import { AiPanel } from './components/AiPanel';
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
        <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 gap-4">
          {/* Left Column - Branches */}
          <div className="w-72 flex-shrink-0">
            <BranchesPanel />
          </div>

          {/* Center Column - Changes + Diff */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="h-[320px] flex-shrink-0">
              <ChangesPanel />
            </div>
            <div className="min-h-0 flex-1">
              <DiffViewer />
            </div>
          </div>

          {/* Right Column - AI */}
          <div className="w-96 flex-shrink-0">
            <AiPanel />
          </div>
        </div>

        {/* Bottom Row - History */}
        <div className="mx-auto h-52 min-h-0 w-full max-w-7xl">
          <HistoryPanel />
        </div>
      </div>

      <SettingsModal />
    </div>
  );
}

export default App;
