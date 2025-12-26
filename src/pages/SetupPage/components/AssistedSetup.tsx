import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/ui';
import type { SetupStatus } from '@/types';
import type { InstallStatus } from '@/stores/setupStore';
import { RequirementCard } from './RequirementCard';

interface AssistedSetupProps {
  status: SetupStatus;
  installProgress: {
    git: InstallStatus;
    gh: InstallStatus;
    gh_auth: InstallStatus;
  };
  isChecking: boolean;
  onInstallGit: () => void;
  onInstallGh: () => void;
  onAuthenticateGh: () => void;
  onRecheck: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export const AssistedSetup: React.FC<AssistedSetupProps> = ({
  status,
  installProgress,
  isChecking,
  onInstallGit,
  onInstallGh,
  onAuthenticateGh,
  onRecheck,
}) => {
  const authBlocked = !status.gh.installed;
  const authStatus = authBlocked ? { ...status.gh_auth, error: null } : status.gh_auth;
  const authTone = authBlocked ? 'pending' : status.gh_auth.installed ? 'success' : status.gh_auth.error ? 'error' : 'pending';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-text2">Instalacao automatica com Homebrew.</p>
          <p className="text-xs text-text3">Clique em Re-verificar apos cada etapa.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onRecheck} isLoading={isChecking}>
          Re-verificar
        </Button>
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid gap-4">
        <motion.div variants={itemVariants}>
          <RequirementCard
            title="Git"
            description="Base para controle de versoes e operacoes locais."
            status={status.git}
            actionLabel={!status.git.installed ? 'Instalar via Homebrew' : undefined}
            onAction={onInstallGit}
            actionDisabled={installProgress.git === 'installing'}
            isLoading={installProgress.git === 'installing'}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <RequirementCard
            title="GitHub CLI"
            description="Necessario para login e fluxos com GitHub."
            status={status.gh}
            actionLabel={!status.gh.installed ? 'Instalar via Homebrew' : undefined}
            onAction={onInstallGh}
            actionDisabled={installProgress.gh === 'installing'}
            isLoading={installProgress.gh === 'installing'}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <RequirementCard
            title="GitHub Authentication"
            description="Login no GitHub para push, pull e operacoes remotas."
            status={authStatus}
            tone={authTone}
            helperText={
              authBlocked
                ? 'Instale o GitHub CLI para liberar o login.'
                : 'Abra o browser e conclua o login para continuar.'
            }
            actionLabel={!status.gh_auth.installed ? 'Autenticar no browser' : undefined}
            onAction={onAuthenticateGh}
            actionDisabled={authBlocked || installProgress.gh_auth === 'installing'}
            isLoading={installProgress.gh_auth === 'installing'}
          />
        </motion.div>
      </motion.div>

      <div className="rounded-card border border-border1 bg-surface2 p-4 text-sm text-text2">
        Instalacoes assistidas usam Homebrew. Se preferir, siga as etapas na aba Manual.
      </div>
    </div>
  );
};

export default AssistedSetup;
