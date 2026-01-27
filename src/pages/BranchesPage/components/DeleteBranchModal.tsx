import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ToggleSwitch } from '@/ui';
import type { Branch } from '@/types';

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  branches: Branch[];
  onConfirm: (deleteCorresponding: boolean) => Promise<void>;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  branch,
  branches,
  onConfirm,
}) => {
  const { t } = useTranslation('branches');
  const { t: tCommon } = useTranslation('common');
  const [deleteCorresponding, setDeleteCorresponding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setDeleteCorresponding(false);
    setIsDeleting(false);
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
  const type = branch.remote ? t('deleteBranch.typeRemote') : t('deleteBranch.typeLocal');
  const correspondingType = branch.remote ? t('deleteBranch.typeLocal') : t('deleteBranch.typeRemote');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="delete-branch-title"
      ariaDescribedBy="delete-branch-description"
      contentClassName="flex flex-col max-h-[calc(100vh-6rem)]"
    >
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6 pb-4">
        <div className="flex flex-col gap-6">
          <div>
            <h2 id="delete-branch-title" className="text-xl font-semibold text-text1">
              {t('deleteBranch.title')}
            </h2>
            <p id="delete-branch-description" className="mt-1 text-sm text-text3">
              {t('deleteBranch.description', { type, name: branch.name })}
            </p>
          </div>

          {hasCorresponding && (
            <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text2">{t('deleteBranch.alsoRemoveCorresponding', { type: correspondingType })}</div>
                <div className="truncate text-xs text-text3">{correspondingBranch?.name}</div>
              </div>
              <ToggleSwitch
                checked={deleteCorresponding}
                onToggle={() => setDeleteCorresponding((prev) => !prev)}
                label={t('deleteBranch.alsoRemoveCorresponding', { type: correspondingType })}
                disabled={isDeleting}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 border-t border-border1 bg-surface1 px-6 py-4">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button size="sm" variant="ghost" onClick={onClose} type="button" disabled={isDeleting}>
            {tCommon('actions.cancel')}
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={async () => {
              if (isDeleting) return;
              setIsDeleting(true);
              try {
                await onConfirm(deleteCorresponding);
              } catch {
                // Toast already shows the error
              } finally {
                setIsDeleting(false);
              }
            }}
            type="button"
            isLoading={isDeleting}
            disabled={isDeleting}
          >
            {t('deleteBranch.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBranchModal;
