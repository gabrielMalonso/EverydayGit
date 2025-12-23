import React from 'react';
import { Button, Input, Modal, SelectMenu } from '@/ui';
import type { Branch } from '@/types';

interface NewBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branches: Branch[];
  currentBranch: string | null;
  onCreateBranch: (name: string, source: string) => Promise<void>;
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
  const [error, setError] = React.useState<string | null>(null);
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
    setError(null);
    setIsSubmitting(false);
  }, [isOpen, currentBranch, branches]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/\s+/g, '-');
    setName(nextValue);
    if (error) setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim().replace(/\s+/g, '-');
    if (!trimmedName) {
      setError('Informe um nome para a branch.');
      return;
    }
    if (existingNames.has(trimmedName.toLowerCase())) {
      setError('Ja existe uma branch com esse nome.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await onCreateBranch(trimmedName, source || currentBranch || '');
      onClose();
    } catch (submitError) {
      console.error('Failed to create branch:', submitError);
      setError('Falha ao criar branch.');
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
              error={error ?? undefined}
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
