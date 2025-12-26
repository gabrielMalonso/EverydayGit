import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSetupStore } from '../stores/setupStore';
import { useToastStore } from '../stores/toastStore';
import type { SetupStatus } from '../types';
import { isDemoMode, isTauriRuntime } from '../demo/demoMode';

const demoStatus: SetupStatus = {
  git: { name: 'Git', installed: true, version: 'Demo', error: null },
  gh: { name: 'GitHub CLI', installed: true, version: 'Demo', error: null },
  gh_auth: { name: 'GitHub Authentication', installed: true, version: null, error: null },
  all_passed: true,
};

const getErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string') return message;
  }
  return String(error);
};

export const useSetup = () => {
  const { status, isChecking, mode, setupSkipped, installProgress } = useSetupStore();
  const {
    setStatus,
    setIsChecking,
    setMode,
    setSetupSkipped,
    setInstallProgress,
    resetInstallProgress,
  } = useSetupStore();
  const { showToast } = useToastStore();

  const checkRequirements = useCallback(async () => {
    resetInstallProgress();
    setIsChecking(true);

    if (!isTauriRuntime()) {
      if (isDemoMode()) {
        setStatus(demoStatus);
      }
      setIsChecking(false);
      return;
    }

    try {
      const nextStatus = await invoke<SetupStatus>('check_all_requirements_cmd');
      setStatus(nextStatus);
    } catch (error) {
      console.error('Failed to check setup requirements:', error);
      showToast('Falha ao verificar requisitos.', 'error');
    } finally {
      setIsChecking(false);
    }
  }, [resetInstallProgress, setIsChecking, setStatus, showToast]);

  const checkHomebrew = async () => {
    if (!isTauriRuntime()) return false;
    try {
      return await invoke<boolean>('check_homebrew_cmd');
    } catch (error) {
      console.error('Failed to check Homebrew:', error);
      return false;
    }
  };

  const installGit = async () => {
    if (!isTauriRuntime()) return;
    setInstallProgress('git', 'installing');

    try {
      const hasHomebrew = await checkHomebrew();
      if (!hasHomebrew) {
        setInstallProgress('git', 'error');
        showToast('Homebrew nao encontrado. Instale antes de continuar.', 'warning');
        return;
      }

      await invoke<string>('install_git_cmd');
      setInstallProgress('git', 'success');
      showToast('Git instalado com sucesso.', 'success');
      await checkRequirements();
    } catch (error) {
      console.error('Failed to install Git:', error);
      setInstallProgress('git', 'error');
      showToast(`Falha ao instalar Git: ${getErrorMessage(error)}`, 'error');
    }
  };

  const installGh = async () => {
    if (!isTauriRuntime()) return;
    setInstallProgress('gh', 'installing');

    try {
      const hasHomebrew = await checkHomebrew();
      if (!hasHomebrew) {
        setInstallProgress('gh', 'error');
        showToast('Homebrew nao encontrado. Instale antes de continuar.', 'warning');
        return;
      }

      await invoke<string>('install_gh_cmd');
      setInstallProgress('gh', 'success');
      showToast('GitHub CLI instalado com sucesso.', 'success');
      await checkRequirements();
    } catch (error) {
      console.error('Failed to install GitHub CLI:', error);
      setInstallProgress('gh', 'error');
      showToast(`Falha ao instalar GitHub CLI: ${getErrorMessage(error)}`, 'error');
    }
  };

  const authenticateGh = async () => {
    if (!isTauriRuntime()) return;
    setInstallProgress('gh_auth', 'installing');

    try {
      await invoke('authenticate_gh_cmd');
      setInstallProgress('gh_auth', 'success');
      showToast('Browser aberto para login. Ao concluir, clique em Re-verificar.', 'success');
    } catch (error) {
      console.error('Failed to authenticate GitHub CLI:', error);
      setInstallProgress('gh_auth', 'error');
      showToast(`Falha ao iniciar autenticacao: ${getErrorMessage(error)}`, 'error');
    }
  };

  const skipSetup = () => {
    setSetupSkipped(true);
  };

  const recheckRequirement = async (_name: string) => {
    await checkRequirements();
  };

  return {
    status,
    isChecking,
    mode,
    setupSkipped,
    installProgress,
    setMode,
    checkRequirements,
    installGit,
    installGh,
    authenticateGh,
    recheckRequirement,
    skipSetup,
  };
};
