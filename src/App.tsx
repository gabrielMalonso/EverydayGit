import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AnimatePresence, motion } from 'framer-motion';
import { SettingsModal } from './components/SettingsModal';
import { RenameTabModal } from './components/RenameTabModal';
import { Layout } from './components/Layout';
import { CommitsPage } from './pages/CommitsPage';
import { BranchesPage } from './pages/BranchesPage';
import { ConflictResolverPage } from './pages/ConflictResolverPage';
import { SetupPage } from './pages/SetupPage';
import { InitRepoPage } from './pages/InitRepoPage';
import { WelcomePage } from './pages/WelcomePage';
import { Toaster } from './ui/Toaster';
import { useSetup } from './hooks/useSetup';
import { isTauriRuntime } from './demo/demoMode';
import { getWindowLabel } from './hooks/useWindowLabel';
import { TabProvider, useCurrentTabId } from './contexts/TabContext';
import { useTabStore } from './stores/tabStore';
import { useTabNavigation } from './hooks/useTabNavigation';
import { useTabRepo } from './hooks/useTabRepo';
import { useTabGit } from './hooks/useTabGit';
import type { RepoSelectionResult } from './types';

const TabContent: React.FC = React.memo(() => {
  const tabId = useCurrentTabId();
  const { currentPage } = useTabNavigation();
  const { repoPath, repoState } = useTabRepo();
  const { refreshAll } = useTabGit();
  const resetTabGit = useTabStore((s) => s.resetTabGit);
  const updateTabGit = useTabStore((s) => s.updateTabGit);
  const getTab = useTabStore((s) => s.getTab);
  const { status, isChecking, setupSkipped } = useSetup();
  const isTauri = isTauriRuntime();

  // Ref pattern to avoid stale closure AND prevent infinite loops
  // refreshAll changes reference on every state update, so we use a ref
  const refreshAllRef = React.useRef(refreshAll);
  React.useLayoutEffect(() => {
    refreshAllRef.current = refreshAll;
  });

  // Track previous repoState to detect transitions
  const prevRepoStateRef = React.useRef(repoState);

  // Use hasInitialLoad from store instead of local ref
  const tab = getTab(tabId);
  const hasInitialLoad = tab?.git?.hasInitialLoad ?? false;

  useEffect(() => {
    if (repoState === 'git' && !hasInitialLoad) {
      // Defer heavy backend work to let tab animation complete first (300ms)
      const timeoutId = setTimeout(() => {

        // Mark as loaded INSIDE setTimeout to prevent cleanup from canceling the timeout
        updateTabGit(tabId, { hasInitialLoad: true });

        React.startTransition(() => {
          refreshAllRef.current();
        });
      }, 300); // Wait for tab animation to complete
      return () => clearTimeout(timeoutId);
    }
  }, [repoState, hasInitialLoad, tabId, updateTabGit]);

  // Only reset git state when transitioning AWAY from git repo (not on every aba change)
  useEffect(() => {
    const wasGit = prevRepoStateRef.current === 'git';
    const isGit = repoState === 'git';

    // Only reset if we're leaving a git repo
    if (wasGit && !isGit) {
      resetTabGit(tabId);
    }

    prevRepoStateRef.current = repoState;
  }, [repoState, resetTabGit, tabId]);

  const shouldShowSetup = isTauri && !isChecking && status && !status.all_passed && !setupSkipped;
  const isSetupPage = currentPage === 'setup';
  const shouldShowInitRepo = Boolean(repoPath) && repoState === 'no-git';
  const isInitRepoPage = currentPage === 'init-repo';
  const shouldShowWelcome = !repoPath && repoState === 'none';

  if (shouldShowWelcome) return <WelcomePage />;
  if (shouldShowSetup || isSetupPage) return <SetupPage />;
  if (shouldShowInitRepo || isInitRepoPage) return <InitRepoPage />;

  const pageVariants = {
    initial: { opacity: 0, y: 6 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };

  const pageTransition = {
    duration: 0.16,
    ease: 'easeOut',
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'branches':
        return <BranchesPage />;
      case 'history':
        return (
          <div className="flex h-full items-center justify-center text-text3">
            Pagina de historico em breve.
          </div>
        );
      case 'conflict-resolver':
        return <ConflictResolverPage />;
      case 'commits':
      default:
        return <CommitsPage />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPage}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="h-full"
      >
        {renderPage()}
      </motion.div>
    </AnimatePresence>
  );
});

TabContent.displayName = 'TabContent';

function App() {
  const { status, isChecking, setupSkipped, checkRequirements } = useSetup();
  // Use individual selectors for methods (stable references)
  const createTab = useTabStore((s) => s.createTab);
  const updateTab = useTabStore((s) => s.updateTab);
  // Use exported selectors for reactive data
  const tabs = useTabStore((s) => s.tabs);
  const tabOrder = useTabStore((s) => s.tabOrder);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const [isInitialized, setIsInitialized] = useState(false);
  const windowLabel = getWindowLabel();
  const isTauri = isTauriRuntime();

  useEffect(() => {
    const initializeTabs = async () => {
      try {
        if (!isTauri) {
          if (tabOrder.length === 0) {
            createTab(null);
          }
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const repoFromUrl = urlParams.get('repo');

        if (repoFromUrl) {
          const decodedPath = decodeURIComponent(repoFromUrl);
          const newTabId = createTab(decodedPath);
          const result = await invoke<RepoSelectionResult>('set_repository', {
            path: decodedPath,
            windowLabel,
            tabId: newTabId,
          });
          updateTab(newTabId, {
            repoPath: decodedPath,
            repoState: result.is_git ? 'git' : 'no-git',
            title: decodedPath.split(/[\\/]/).pop() || 'Repositório',
          });
          if (!result.is_git) {
            useTabStore.getState().updateTabNavigation(newTabId, 'init-repo');
          }
          return;
        }

        if (tabOrder.length === 0) {
          // Always start with empty tab - Welcome Page will be shown
          createTab(null);
        } else {
          for (const tabId of tabOrder) {
            const tab = tabs[tabId];
            if (!tab?.repoPath) continue;
            try {
              await invoke('set_repository', {
                path: tab.repoPath,
                windowLabel,
                tabId,
              });
            } catch (error) {
              console.error(`Failed to restore repository for tab ${tabId}:`, error);
            }
          }
        }
      } catch (error) {
        console.error('Falha ao inicializar abas:', error);
      } finally {
        setIsInitialized(true);
      }
    };

    void initializeTabs();
  }, []);

  useEffect(() => {
    if (!isTauri) return;

    const handleBeforeUnload = () => {
      for (const tabId of tabOrder) {
        const contextKey = `${windowLabel}:${tabId}`;
        void invoke('unset_tab_repository', { contextKey });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTauri, windowLabel, tabOrder]);

  useEffect(() => {
    if (!isTauri) return;
    checkRequirements().catch((error) => console.error('Falha ao verificar requisitos:', error));
  }, [checkRequirements, isTauri]);

  const shouldShowSetup = isTauri && !isChecking && status && !status.all_passed && !setupSkipped;

  const activeTab = activeTabId ? tabs[activeTabId] : null;
  const isValidTab = activeTab && activeTab.git !== undefined;

  // Nota: Verificar se inicialização foi concluída antes de renderizar
  // Isso evita que componentes chamem funções Git antes do backend estar pronto
  if (!isInitialized || !activeTabId || !isValidTab) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text1">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          <div className="text-text2">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <TabProvider tabId={activeTabId}>
        <Layout>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeTabId}:${shouldShowSetup ? 'setup' : 'content'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              <TabContent />
            </motion.div>
          </AnimatePresence>
        </Layout>
      </TabProvider>
      <SettingsModal />
      <RenameTabModal />
      <Toaster />
    </>
  );
}

export default App;
