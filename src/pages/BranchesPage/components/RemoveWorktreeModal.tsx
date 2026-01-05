import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('branches');
  const { t: tCommon } = useTranslation('common');
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
            {t('removeWorktree.title')}
          </h2>
          <p id="remove-worktree-description" className="mt-1 text-sm text-text3">
            {t('removeWorktree.description')}
          </p>
        </div>

        <div className="rounded-card-inner border border-border1 bg-surface2 px-4 py-3">
          <div className="text-xs font-semibold uppercase text-text3">{t('removeWorktree.selectedWorktree')}</div>
          <div className="mt-1 text-sm font-medium text-text1">{worktree.branch}</div>
          <div className="mt-1 truncate text-xs text-text3" title={worktree.path}>
            {worktree.path}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isRemoving}>
            {tCommon('actions.cancel')}
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
                // Toast already shows the error
              } finally {
                setIsRemoving(false);
              }
            }}
          >
            {t('removeWorktree.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RemoveWorktreeModal;
