import React from 'react';
import { Button, Modal, ToggleSwitch } from '@/ui';
import type { Branch } from '@/types';

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  branches: Branch[];
  onConfirm: (deleteCorresponding: boolean) => void;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  branch,
  branches,
  onConfirm,
}) => {
  const [deleteCorresponding, setDeleteCorresponding] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) setDeleteCorresponding(false);
  }, [isOpen]);

  const correspondingBranch = React.useMemo(() => {
    if (!branch) return null;

    if (branch.remote) {
      const localName = branch.name.replace(/^[^/]+\//, '');
      return branches.find((b) => !b.remote && b.name === localName) ?? null;
    }

    return branches.find((b) => b.remote && b.name === `origin/${branch.name}`) ?? null;
  }, [branch, branches]);

  if (!branch) return null;

  const hasCorresponding = !!correspondingBranch;
  const tipo = branch.remote ? 'remota' : 'local';
  const tipoCorrespondente = branch.remote ? 'local' : 'remota';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="delete-branch-title"
      ariaDescribedBy="delete-branch-description"
    >
      <div className="flex flex-col gap-6 p-6">
        <div>
          <h2 id="delete-branch-title" className="text-xl font-semibold text-text1">
            Remover branch
          </h2>
          <p id="delete-branch-description" className="mt-1 text-sm text-text3">
            Deseja remover a branch {tipo} <span className="font-semibold text-text1">{branch.name}</span>?
          </p>
        </div>

        {hasCorresponding && (
          <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
            <div className="min-w-0">
              <div className="text-sm font-medium text-text2">Excluir também a branch {tipoCorrespondente}</div>
              <div className="truncate text-xs text-text3">{correspondingBranch?.name}</div>
            </div>
            <ToggleSwitch
              checked={deleteCorresponding}
              onToggle={() => setDeleteCorresponding((prev) => !prev)}
              label={`Excluir branch ${tipoCorrespondente}`}
            />
          </div>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => onConfirm(deleteCorresponding)}
            type="button"
          >
            Remover
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBranchModal;
