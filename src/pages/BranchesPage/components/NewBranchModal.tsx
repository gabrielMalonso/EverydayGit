import React from 'react';
import { Button, Input, Modal, SelectMenu, ToggleSwitch } from '@/ui';
import type { Branch } from '@/types';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranch: string | null;
  onCreateBranch: (name: string, source: string, pushToRemote: boolean) => Promise<void>;
}

export const NewBranchModal: React.FC<NewBranchModalProps> = ({
  isOpen,
  onClose,
  branches,
  currentBranch,
  onCreateBranch,
}) => {
  const [name, setName] = React.useState('');
  const [source, setSource] = React.useState('');
  const [pushToRemote, setPushToRemote] = React.useState(false);
  const [nameError, setNameError] = React.useState<string | null>(null);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const branchOptions = React.useMemo(
    () =>
      branches.map((branch) => {
        const tags: string[] = [];
        if (branch.current) tags.push('atual');
        if (branch.remote) tags.push('remota');
        return {
          value: branch.name,
          label: tags.length ? `${branch.name} (${tags.join(', ')})` : branch.name,
        };
      }),
    [branches],
  );

  const existingNames = React.useMemo(() => {
    return new Set(branches.map((branch) => branch.name.toLowerCase()));
  }, [branches]);

  React.useEffect(() => {
    if (!isOpen) return;
    const defaultSource =
      currentBranch || branches.find((branch) => branch.current)?.name || branches[0]?.name || '';
    setName('');
    setSource(defaultSource);
    setPushToRemote(false);
    setNameError(null);
    setFormError(null);
    setIsSubmitting(false);
  }, [isOpen, currentBranch, branches]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/\s+/g, '-');
    setName(nextValue);
    if (nameError) setNameError(null);
    if (formError) setFormError(null);
  };

  const getErrorMessage = (value: unknown) => {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'message' in value && typeof value.message === 'string') {
      return value.message;
    }
    return String(value);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim().replace(/\s+/g, '-');
    if (!trimmedName) {
      setNameError('Informe um nome para a branch.');
      return;
    }
    if (existingNames.has(trimmedName.toLowerCase())) {
      setNameError('Ja existe uma branch com esse nome.');
      return;
    }

    setNameError(null);
    setFormError(null);
    setIsSubmitting(true);
    try {
      await onCreateBranch(trimmedName, source || currentBranch || '', pushToRemote);
      onClose();
    } catch (submitError) {
      console.error('Failed to create branch:', submitError);
      const message = getErrorMessage(submitError);
      setFormError(message || 'Falha ao criar branch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="new-branch-title"
      ariaDescribedBy="new-branch-description"
    >
      <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
        <div>
          <h2 id="new-branch-title" className="text-xl font-semibold text-text1">
            Criar branch
          </h2>
          <p id="new-branch-description" className="text-sm text-text3">
            Defina o nome e a branch de origem.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Input
              id="new-branch-name"
              label="Nome da nova branch"
              value={name}
              onChange={handleNameChange}
              placeholder="feature/minha-branch"
              error={nameError ?? undefined}
              autoFocus
            />
            <div className="mt-2 text-xs text-text3">Espacos sao convertidos para "-".</div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-text2">Source</label>
            <SelectMenu
              id="new-branch-source"
              value={source}
              options={branchOptions}
              onChange={(value) => setSource(value as string)}
              placeholder="Selecione a branch de origem"
              disabled={branchOptions.length === 0}
            />
          </div>

          <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-text2">Publicar no remoto</div>
              <div className="text-xs text-text3">Faz push da branch para origin</div>
            </div>
            <ToggleSwitch
              checked={pushToRemote}
              onToggle={() => setPushToRemote((prev) => !prev)}
              label="Publicar no remoto"
              disabled={isSubmitting}
            />
          </div>

          {formError && (
            <div className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger whitespace-pre-wrap break-words">
              {formError}
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
            Criar branch
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default NewBranchModal;
