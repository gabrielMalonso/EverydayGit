import React from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';
import { AppSidebar } from '@/components/AppSidebar';
import { SidebarInset } from '@/ui/Sidebar';
import { Button, Input, SelectMenu, ToggleSwitch } from '@/ui';
import { useRepoStore } from '@/stores/repoStore';
import { useToastStore } from '@/stores/toastStore';
import { useNavigationStore } from '@/stores/navigationStore';
import { useGitStore } from '@/stores/gitStore';
import { isTauriRuntime } from '@/demo/demoMode';
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
  const { repoPath, setRepoSelection } = useRepoStore();
  const { setPage } = useNavigationStore();
  const { showToast } = useToastStore();
  const { reset } = useGitStore();
  const isTauri = isTauriRuntime();

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
      showToast('Selecione uma pasta primeiro.', 'warning');
      return;
    }
    if (nameError || commitError) {
      showToast('Preencha os campos obrigatorios.', 'warning');
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
      const result = await invoke<InitRepoResult>('init_repository_cmd', { options: payload });
      setRepoSelection(repoPath, 'git');
      const createdLabel = result.created_files.length
        ? `Criados: ${result.created_files.join(', ')}`
        : 'Repositorio inicializado.';
      showToast(createdLabel, 'success');

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
            showToast(`Publicado no GitHub: ${publishResult.url}`, 'success');
          } else {
            showToast('Publicado no GitHub.', 'success');
          }
        } catch (publishError) {
          console.error('Failed to publish GitHub repo:', publishError);
          showToast('Repositorio criado, mas falha ao publicar no GitHub.', 'warning');
        }
      }

      setPage('commits');
    } catch (error) {
      console.error('Failed to init repository:', error);
      showToast('Falha ao inicializar repositorio.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    reset();
    setRepoSelection(null, 'none');
    setPage('commits');
  };

  return (
    <div className="flex h-screen bg-bg text-text1">
      <AppSidebar />
      <SidebarInset>
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
                    onChange={() => {}}
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
                    <label className="text-sm font-medium text-text2">Descricao</label>
                    <textarea
                      className="mt-2 h-24 w-full rounded-input border border-border1 bg-surface2 px-3 py-2.5 text-sm text-text1 placeholder:text-text3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--focus-ring))]"
                      placeholder="O que esse repositorio vai guardar?"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-border1 text-xs text-text2">
                    2
                  </div>
                  <h2 className="text-lg font-semibold text-text1">Configuration</h2>
                </div>

                <div className="space-y-3 rounded-card border border-border1 bg-surface2/40 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm font-medium text-text1">Default branch *</div>
                      <div className="text-xs text-text3">Defina a branch inicial do repositorio.</div>
                    </div>
                    <SelectMenu
                      id="init-repo-branch"
                      value={defaultBranch}
                      options={branchOptions}
                      onChange={(value) => setDefaultBranch(String(value))}
                      menuWidthClass="min-w-[160px]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-text1">Add README</div>
                      <div className="text-xs text-text3">Cria um README.md basico.</div>
                    </div>
                    <ToggleSwitch
                      checked={addReadme}
                      onToggle={() => setAddReadme((prev) => !prev)}
                      ariaLabel="Adicionar README"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-text1">Add .gitignore</div>
                      <div className="text-xs text-text3">Selecione um template inicial.</div>
                    </div>
                    <SelectMenu
                      id="init-repo-gitignore"
                      value={gitignoreTemplate}
                      options={gitignoreOptions}
                      onChange={(value) => setGitignoreTemplate(String(value))}
                      menuWidthClass="min-w-[160px]"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-text1">Add license</div>
                      <div className="text-xs text-text3">Opcional. Voce pode ajustar depois.</div>
                    </div>
                    <SelectMenu
                      id="init-repo-license"
                      value={license}
                      options={licenseOptions}
                      onChange={(value) => setLicense(String(value))}
                      menuWidthClass="min-w-[160px]"
                    />
                  </div>

                  {isTauri && (
                    <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-text1">Publicar no GitHub agora</div>
                        <div className="text-xs text-text3">Requer GitHub CLI autenticado.</div>
                      </div>
                      <ToggleSwitch
                        checked={publishNow}
                        onToggle={() =>
                          setPublishNow((prev) => {
                            const next = !prev;
                            if (next && !initialCommit) {
                              setInitialCommit(true);
                            }
                            return next;
                          })
                        }
                        ariaLabel="Publicar no GitHub agora"
                      />
                    </div>
                  )}

                  {isTauri && publishNow && (
                    <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-text1">Visibilidade</div>
                        <div className="text-xs text-text3">Defina quem pode ver o repositorio.</div>
                      </div>
                      <SelectMenu
                        id="init-repo-visibility"
                        value={publishVisibility}
                        options={visibilityOptions}
                        onChange={(value) => setPublishVisibility(value as 'public' | 'private')}
                        menuWidthClass="min-w-[160px]"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-4 rounded-card-inner border border-border1 bg-surface1/40 px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-text1">Initial commit</div>
                      <div className="text-xs text-text3">Cria o primeiro commit automaticamente.</div>
                    </div>
                    <ToggleSwitch
                      checked={initialCommit}
                      onToggle={() => setInitialCommit((prev) => !prev)}
                      ariaLabel="Commit inicial"
                      disabled={initialCommitLocked}
                    />
                  </div>

                  {initialCommit && (
                    <Input
                      label="Mensagem do commit *"
                      value={commitMessage}
                      onChange={(event) => setCommitMessage(event.target.value)}
                      placeholder="chore: init repo"
                      error={hasSubmitted ? commitError ?? undefined : undefined}
                    />
                  )}
                </div>
              </section>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border1 pt-6">
              <Button variant="ghost" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreate} isLoading={isSubmitting} disabled={!canCreate}>
                Criar repositorio
              </Button>
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
};

export default InitRepoPage;
