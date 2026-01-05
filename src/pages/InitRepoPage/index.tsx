import React from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { toast } from 'sonner';
import { Button, Input, SelectMenu, ToggleSwitch } from '@/ui';
import { isTauriRuntime } from '@/demo/demoMode';
import { getWindowLabel } from '@/hooks/useWindowLabel';
import { useTabRepo } from '@/hooks/useTabRepo';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { useTabStore } from '@/stores/tabStore';
import { useCurrentTabId } from '@/contexts/TabContext';
import type { InitRepoOptions, InitRepoResult, PublishRepoOptions, PublishRepoResult } from '@/types';
import type { SelectOption } from '@/ui/SelectMenu';

const branchOptions: SelectOption[] = [
  { value: 'main', label: 'main' },
  { value: 'master', label: 'master' },
  { value: 'develop', label: 'develop' },
];

const gitignoreOptions: SelectOption[] = [
  { value: 'none', label: 'No .gitignore' },
  { value: 'node', label: 'Node' },
  { value: 'python', label: 'Python' },
  { value: 'rust', label: 'Rust' },
  { value: 'go', label: 'Go' },
  { value: 'java', label: 'Java' },
];

const licenseOptions: SelectOption[] = [
  { value: 'none', label: 'No license' },
  { value: 'mit', label: 'MIT' },
];

const visibilityOptions: SelectOption[] = [
  { value: 'public', label: 'Publico' },
  { value: 'private', label: 'Privado' },
];

const getFolderName = (path: string | null) => {
  if (!path) return '';
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
};

export const InitRepoPage: React.FC = () => {
  const tabId = useCurrentTabId();
  const { repoPath, clearRepository } = useTabRepo();
  const { setPage } = useTabNavigation();
  const resetTabGit = useTabStore((s) => s.resetTabGit);
  const updateTab = useTabStore((s) => s.updateTab);
  const isTauri = isTauriRuntime();
  const windowLabel = getWindowLabel();

  const [repoName, setRepoName] = React.useState('');
  const [nameTouched, setNameTouched] = React.useState(false);
  const [description, setDescription] = React.useState('');
  const [defaultBranch, setDefaultBranch] = React.useState('main');
  const [addReadme, setAddReadme] = React.useState(true);
  const [gitignoreTemplate, setGitignoreTemplate] = React.useState('none');
  const [license, setLicense] = React.useState('none');
  const [initialCommit, setInitialCommit] = React.useState(true);
  const [commitMessage, setCommitMessage] = React.useState('chore: init repo');
  const [publishNow, setPublishNow] = React.useState(false);
  const [publishVisibility, setPublishVisibility] = React.useState<'public' | 'private'>('public');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasSubmitted, setHasSubmitted] = React.useState(false);

  React.useEffect(() => {
    const folderName = getFolderName(repoPath);
    if (!nameTouched && folderName) {
      setRepoName(folderName);
    }
  }, [repoPath, nameTouched]);

  const trimmedName = repoName.trim();
  const trimmedCommit = commitMessage.trim();
  const initialCommitLocked = publishNow;
  const nameError = trimmedName ? null : 'Informe o nome do repositorio.';
  const commitError = initialCommit && !trimmedCommit ? 'Informe a mensagem do commit inicial.' : null;
  const canCreate = Boolean(repoPath) && !nameError && !commitError && !isSubmitting;

  const handleCreate = async () => {
    setHasSubmitted(true);
    if (!repoPath) {
      toast.warning('Selecione uma pasta primeiro.');
      return;
    }
    if (nameError || commitError) {
      toast.warning('Preencha os campos obrigatorios.');
      return;
    }

    const payload: InitRepoOptions = {
      path: repoPath,
      name: trimmedName,
      description: description.trim() ? description.trim() : null,
      default_branch: defaultBranch,
      add_readme: addReadme,
      gitignore_template: gitignoreTemplate === 'none' ? null : gitignoreTemplate,
      license: license === 'none' ? null : license,
      initial_commit: initialCommit,
      commit_message: initialCommit ? trimmedCommit : null,
    };

    setIsSubmitting(true);
    try {
      const result = await invoke<InitRepoResult>('init_repository_cmd', {
        options: payload,
        windowLabel,
        tabId,
      });
      updateTab(tabId, { repoState: 'git' });
      const createdLabel = result.created_files.length
        ? `Criados: ${result.created_files.join(', ')}`
        : 'Repositorio inicializado.';
      toast.success(createdLabel);

      if (publishNow && isTauri) {
        const publishOptions: PublishRepoOptions = {
          path: repoPath,
          name: trimmedName,
          visibility: publishVisibility,
          description: description.trim() ? description.trim() : null,
        };
        try {
          const publishResult = await invoke<PublishRepoResult>('publish_github_repo_cmd', {
            options: publishOptions,
          });
          if (publishResult.url) {
            toast.success(`Publicado no GitHub: ${publishResult.url}`);
          } else {
            toast.success('Publicado no GitHub.');
          }
        } catch (publishError) {
          console.error('Failed to publish GitHub repo:', publishError);
          toast.warning('Repositorio criado, mas falha ao publicar no GitHub.');
        }
      }

      setPage('commits');
    } catch (error) {
      console.error('Failed to init repository:', error);
      toast.error('Falha ao inicializar repositorio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    resetTabGit(tabId);
    await clearRepository();
    setPage('commits');
  };

  return (
    <div className="relative h-full overflow-y-auto">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-[-10%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-[-25%] left-[-5%] h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-full w-full max-w-6xl flex-col px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="space-y-3"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.35em] text-text3">Novo repositorio</p>
            <h1 className="text-3xl font-semibold text-text1">Criar um novo repositorio</h1>
            <p className="max-w-2xl text-sm text-text2">
              Essa pasta ainda nao possui um repositorio Git. Configure o basico para iniciar.
            </p>
          </div>
          <p className="text-xs text-text3">Campos obrigatorios marcados com *.</p>
        </motion.div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border1 text-xs text-text2">
                1
              </div>
              <h2 className="text-lg font-semibold text-text1">General</h2>
            </div>
            <div className="space-y-4 rounded-card border border-border1 bg-surface2/40 p-5">
              <Input
                label="Pasta"
                value={repoPath ?? 'Nenhuma pasta selecionada'}
                onChange={() => { }}
                readOnly
                inputClassName="font-mono text-xs"
              />
              <Input
                label="Nome do repositorio *"
                value={repoName}
                onChange={(event) => {
                  setRepoName(event.target.value);
                  setNameTouched(true);
                }}
                placeholder="meu-projeto"
                error={hasSubmitted ? nameError ?? undefined : undefined}
              />
              <div>
                <Input
                  label="Descricao"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Breve descricao"
                />
                <p className="mt-2 text-xs text-text3">Opcional, usado ao publicar no GitHub.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border1 text-xs text-text2">
                2
              </div>
              <h2 className="text-lg font-semibold text-text1">Git</h2>
            </div>
            <div className="space-y-4 rounded-card border border-border1 bg-surface2/40 p-5">
              <SelectMenu
                id="default-branch"
                label="Branch padrao"
                value={defaultBranch}
                options={branchOptions}
                onChange={(value) => setDefaultBranch(String(value))}
              />
              <SelectMenu
                id="gitignore-template"
                label="Template .gitignore"
                value={gitignoreTemplate}
                options={gitignoreOptions}
                onChange={(value) => setGitignoreTemplate(String(value))}
              />
              <SelectMenu
                id="license"
                label="Licenca"
                value={license}
                options={licenseOptions}
                onChange={(value) => setLicense(String(value))}
              />
              <ToggleSwitch
                checked={addReadme}
                onToggle={() => setAddReadme((prev) => !prev)}
                label="Adicionar README"
              />
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border1 text-xs text-text2">
                3
              </div>
              <h2 className="text-lg font-semibold text-text1">Commit inicial</h2>
            </div>
            <div className="space-y-4 rounded-card border border-border1 bg-surface2/40 p-5">
              <ToggleSwitch
                checked={initialCommit}
                onToggle={() => setInitialCommit((prev) => !prev)}
                label="Criar commit inicial"
                disabled={initialCommitLocked}
              />
              {initialCommit && (
                <Input
                  label="Mensagem do commit *"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  error={hasSubmitted ? commitError ?? undefined : undefined}
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border1 text-xs text-text2">
                4
              </div>
              <h2 className="text-lg font-semibold text-text1">Publicar</h2>
            </div>
            <div className="space-y-4 rounded-card border border-border1 bg-surface2/40 p-5">
              <ToggleSwitch
                checked={publishNow}
                onToggle={() => setPublishNow((prev) => !prev)}
                label="Publicar no GitHub"
                disabled={!isTauri}
              />
              {publishNow && (
                <SelectMenu
                  id="visibility"
                  label="Visibilidade"
                  value={publishVisibility}
                  options={visibilityOptions}
                  onChange={(value) => setPublishVisibility(value as 'public' | 'private')}
                />
              )}
              {!isTauri && (
                <p className="text-xs text-text3">Publicacao disponivel apenas no app desktop.</p>
              )}
            </div>

            <div className="rounded-card border border-border1 bg-surface1 p-4">
              <p className="text-xs text-text3">
                Pronto para criar o repositorio? Revise as informacoes antes de continuar.
              </p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-end gap-3">
          <Button variant="ghost" onClick={handleCancel} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={!canCreate}
            isLoading={isSubmitting}
          >
            Criar repositorio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InitRepoPage;
