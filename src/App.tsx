import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsModal } from './components/SettingsModal';
import { Layout } from './components/Layout';
import { CommitsPage } from './pages/CommitsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ConflictResolverPage } from './pages/ConflictResolverPage';
import { SetupPage } from './pages/SetupPage';
import { Toast } from './ui';
import { useRepoStore } from './stores/repoStore';
import { useToastStore } from './stores/toastStore';
import { useNavigationStore } from './stores/navigationStore';
import { useConfig } from './hooks/useConfig';
import { useSetup } from './hooks/useSetup';
import { isTauriRuntime } from './demo/demoMode';

function App() {
  const { setRepoPath } = useRepoStore();
  const { loadConfig } = useConfig();
  const { message, type, show, hideToast } = useToastStore();
  const { currentPage } = useNavigationStore();
  const { status, isChecking, setupSkipped, checkRequirements } = useSetup();
  const isTauri = isTauriRuntime();

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

  useEffect(() => {
    if (!isTauri) return;
    checkRequirements().catch((error) => console.error('Falha ao verificar requisitos:', error));
  }, [checkRequirements, isTauri]);

  const renderPage = () => {
    switch (currentPage) {
      case 'branches':
        return <BranchesPage />;
      case 'history':
        return (
          <div className="flex h-full items-center justify-center text-text3">
            Página de histórico em breve.
          </div>
        );
      case 'conflict-resolver':
        return <ConflictResolverPage />;
      case 'setup':
        return <SetupPage />;
      case 'commits':
      default:
        return <CommitsPage />;
    }
  };

  const shouldShowSetup = isTauri && !isChecking && status && !status.all_passed && !setupSkipped;
  const isSetupPage = currentPage === 'setup';

  return (
    <>
      {shouldShowSetup || isSetupPage ? (
        <SetupPage />
      ) : (
        <>
          <Layout>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </Layout>
          <SettingsModal />
        </>
      )}
      <Toast message={message} type={type} show={show} onClose={hideToast} />
    </>
  );
}

export default App;
