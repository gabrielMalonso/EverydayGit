import React from 'react';
import { motion } from 'framer-motion';
import { Button, Spinner } from '@/ui';
import { useSetup } from '@/hooks/useSetup';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabRepo } from '@/hooks/useTabRepo';
import { AssistedSetup } from './components/AssistedSetup';
import { AuthCodeModal } from './components/AuthCodeModal';
import { ManualSetup } from './components/ManualSetup';
import { SetupTabs } from './components/SetupTabs';
import { StepIndicator } from './components/StepIndicator';

export const SetupPage: React.FC = () => {
  const {
    status,
    isChecking,
    mode,
    installProgress,
    authCode,
    setMode,
    checkRequirements,
    installGit,
    installGh,
    authenticateGh,
    clearAuthCode,
    skipSetupWithoutNavigation,
  } = useSetup();

  // Hooks de navegação - agora chamados diretamente no SetupPage (que está dentro do TabProvider)
  const { currentPage, setPage } = useTabNavigation();
  const { repoState } = useTabRepo();

  const isManualSetup = currentPage === 'setup';

  const skipSetup = () => {
    if (isManualSetup) {
      setPage(repoState === 'no-git' ? 'init-repo' : 'commits');
    } else {
      skipSetupWithoutNavigation();
    }
  };

  const goToApp = () => {
    setPage(repoState === 'no-git' ? 'init-repo' : 'commits');
  };

  const steps: React.ComponentProps<typeof StepIndicator>['steps'] = [
    { label: 'Git', status: status?.git },
    { label: 'GitHub CLI', status: status?.gh },
    {
      label: 'Auth',
      status: status?.gh_auth,
      stateOverride: status?.gh?.installed ? undefined : 'pending',
    },
  ];

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-10%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[-5%] h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-5xl flex-col px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-4"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-text3">Setup inicial</p>
            <h1 className="text-3xl font-semibold text-text1">
              Vamos preparar seu ambiente para o EverydayGit
            </h1>
            <p className="max-w-2xl text-sm text-text2">
              Verificamos Git, GitHub CLI e autenticacao. Voce pode pular e usar o app mesmo assim.
            </p>
          </div>

          {status ? <StepIndicator steps={steps} /> : null}
        </motion.div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <SetupTabs value={mode} onChange={setMode} />
          <Button variant="ghost" size="sm" onClick={checkRequirements} isLoading={isChecking}>
            {isChecking ? 'Verificando...' : 'Re-verificar agora'}
          </Button>
        </div>

        <div className="mt-6 flex-1">
          {isChecking && !status ? (
            <div className="flex h-full items-center justify-center gap-3 text-text2">
              <Spinner />
              Verificando requisitos...
            </div>
          ) : status ? (
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-card border border-border1 bg-surface2/40 p-6"
            >
              {mode === 'assisted' ? (
                <AssistedSetup
                  status={status}
                  installProgress={installProgress}
                  isChecking={isChecking}
                  onInstallGit={installGit}
                  onInstallGh={installGh}
                  onAuthenticateGh={authenticateGh}
                  onRecheck={checkRequirements}
                />
              ) : (
                <ManualSetup isChecking={isChecking} onRecheck={checkRequirements} />
              )}
            </motion.div>
          ) : (
            <div className="rounded-card border border-border1 bg-surface1 p-6 text-text2">
              Nao foi possivel carregar o status. Tente re-verificar.
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border1 pt-6 text-sm text-text3">
          {status?.all_passed ? (
            <>
              <span className="text-successFg">Todos os requisitos estao instalados!</span>
              <Button variant="primary" size="sm" onClick={goToApp}>
                Continuar para o app
              </Button>
            </>
          ) : (
            <>
              <span>Algumas funcoes podem falhar sem esses requisitos.</span>
              <Button variant="ghost" size="sm" onClick={skipSetup}>
                {isManualSetup ? 'Voltar ao app' : 'Pular setup (usar mesmo assim)'}
              </Button>
            </>
          )}
        </div>
      </div>

      <AuthCodeModal code={authCode} onClose={clearAuthCode} onRecheck={checkRequirements} />
    </div>
  );
};

export default SetupPage;
