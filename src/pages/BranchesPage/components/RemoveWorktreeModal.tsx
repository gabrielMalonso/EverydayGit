import React from 'react';
import { Button, Modal } from '@/ui';
import type { Worktree } from '@/types';

interface RemoveWorktreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  worktree: Worktree | null;
  onConfirm: (worktree: Worktree) => Promise<void> | void;
}

export const RemoveWorktreeModal: React.FC<RemoveWorktreeModalProps> = ({
  isOpen,
  onClose,
  worktree,
  onConfirm,
}) => {
  const [isRemoving, setIsRemoving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setIsRemoving(false);
  }, [isOpen, worktree]);

  if (!worktree) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="remove-worktree-title"
      ariaDescribedBy="remove-worktree-description"
    >
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h2 id="remove-worktree-title" className="text-xl font-semibold text-text1">
            Remover worktree
          </h2>
          <p id="remove-worktree-description" className="mt-1 text-sm text-text3">
            Esta ação remove apenas o vínculo com o repositório. Os arquivos no diretório serão mantidos.
          </p>
        </div>

        <div className="rounded-card-inner border border-border1 bg-surface2 px-4 py-3">
          <div className="text-xs font-semibold uppercase text-text3">Worktree selecionada</div>
          <div className="mt-1 text-sm font-medium text-text1">{worktree.branch}</div>
          <div className="mt-1 truncate text-xs text-text3" title={worktree.path}>
            {worktree.path}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isRemoving}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="danger"
            type="button"
            isLoading={isRemoving}
            disabled={isRemoving}
            onClick={async () => {
              if (isRemoving) return;
              setIsRemoving(true);
              try {
                await onConfirm(worktree);
                onClose();
              } catch {
                // Toast já exibe o erro
              } finally {
                setIsRemoving(false);
              }
            }}
          >
            Remover
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RemoveWorktreeModal;
