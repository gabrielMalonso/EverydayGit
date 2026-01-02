import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsModal } from './components/SettingsModal';
import { Layout } from './components/Layout';
import { CommitsPage } from './pages/CommitsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ConflictResolverPage } from './pages/ConflictResolverPage';
import { SetupPage } from './pages/SetupPage';
import { InitRepoPage } from './pages/InitRepoPage';
import { Toast } from './ui';
import { useRepoStore } from './stores/repoStore';
import { useGitStore } from './stores/gitStore';
import { useToastStore } from './stores/toastStore';
import { useNavigationStore } from './stores/navigationStore';
import { useConfig } from './hooks/useConfig';
import { useSetup } from './hooks/useSetup';
import { isTauriRuntime } from './demo/demoMode';
import type { RepoSelectionResult } from './types';

function App() {
  const { repoPath, repoState, setRepoSelection } = useRepoStore();
  const { reset } = useGitStore();
  const { loadConfig } = useConfig();
  const { message, type, show, hideToast } = useToastStore();
  const { currentPage, setPage } = useNavigationStore();
  const { status, isChecking, setupSkipped, checkRequirements } = useSetup();
  const isTauri = isTauriRuntime();

  useEffect(() => {
    if (!isTauri) return;

    const restoreLastRepo = async () => {
      try {
        // Check for repo query param first (for worktree windows)
        const urlParams = new URLSearchParams(window.location.search);
        const repoFromUrl = urlParams.get('repo');

        if (repoFromUrl) {
          // Decode the path
          const decodedPath = decodeURIComponent(repoFromUrl);
          try {
            const result = await invoke<RepoSelectionResult>('set_repository', { path: decodedPath });
            setRepoSelection(decodedPath, result.is_git ? 'git' : 'no-git');
            if (!result.is_git) {
              setPage('init-repo');
            }
            return; // Don't restore from config if we have URL param
          } catch (error) {
            console.warn('Repositório do URL não acessível:', error);
          }
        }

        // Fallback to last repo from config
        const config = await loadConfig();
        if (config?.last_repo_path) {
          try {
            const result = await invoke<RepoSelectionResult>('set_repository', { path: config.last_repo_path });
            setRepoSelection(config.last_repo_path, result.is_git ? 'git' : 'no-git');
            if (!result.is_git) {
              setPage('init-repo');
            }
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
    if (repoState !== 'git') {
      reset();
    }
  }, [repoState, reset]);

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
      case 'init-repo':
        return <InitRepoPage />;
      case 'commits':
      default:
        return <CommitsPage />;
    }
  };

  const shouldShowSetup = isTauri && !isChecking && status && !status.all_passed && !setupSkipped;
  const isSetupPage = currentPage === 'setup';
  const shouldShowInitRepo = Boolean(repoPath) && repoState === 'no-git';
  const isInitRepoPage = currentPage === 'init-repo';

  const getPageContent = () => {
    if (shouldShowSetup || isSetupPage) return <SetupPage />;
    if (shouldShowInitRepo || isInitRepoPage) return <InitRepoPage />;
    return renderPage();
  };

  return (
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
            {getPageContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>
      <SettingsModal />
      <Toast message={message} type={type} show={show} onClose={hideToast} />
    </>
  );
}

export default App;
