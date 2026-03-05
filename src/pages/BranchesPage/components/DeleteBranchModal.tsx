import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, ToggleSwitch } from '@/ui';
import type { Branch } from '@/types';

interface DeleteBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  branch: Branch | null;
  selectedBranches?: Branch[];
  branches: Branch[];
  onConfirm: (deleteCorresponding: boolean) => Promise<void>;
}

export const DeleteBranchModal: React.FC<DeleteBranchModalProps> = ({
  isOpen,
  onClose,
  branch,
  selectedBranches = [],
  branches,
  onConfirm,
}) => {
  const { t } = useTranslation('branches');
  const { t: tCommon } = useTranslation('common');
  const [deleteCorresponding, setDeleteCorresponding] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isMultiSelection = selectedBranches.length > 1;

  React.useEffect(() => {
    if (!isOpen) return;
    setDeleteCorresponding(false);
    setIsDeleting(false);
  }, [isOpen]);

  const correspondingBranch = React.useMemo(() => {
    if (isMultiSelection) return null;
    if (!branch) return null;

    if (branch.remote) {
      const localName = branch.name.replace(/^[^/]+\//, '');
      return branches.find((b) => !b.remote && b.name === localName) ?? null;
    }

    return branches.find((b) => b.remote && b.name === `origin/${branch.name}`) ?? null;
  }, [branch, branches, isMultiSelection]);

  const localSelectedNames = React.useMemo(
    () => selectedBranches.filter((item) => !item.remote).map((item) => item.name.replace(/^\+ /, '')),
    [selectedBranches],
  );

  const correspondingRemoteCount = React.useMemo(() => {
    if (!isMultiSelection) return 0;
    const remoteSet = new Set(
      branches.filter((item) => item.remote).map((item) => item.name),
    );
    return localSelectedNames.filter((name) => remoteSet.has(`origin/${name}`)).length;
  }, [branches, isMultiSelection, localSelectedNames]);

  if (!isMultiSelection && !branch) return null;

  const hasCorresponding = isMultiSelection ? correspondingRemoteCount > 0 : !!correspondingBranch;
  const type = branch?.remote ? t('deleteBranch.typeRemote') : t('deleteBranch.typeLocal');
  const correspondingType = branch?.remote ? t('deleteBranch.typeLocal') : t('deleteBranch.typeRemote');
  const previewNames = localSelectedNames.slice(0, 5);
  const hiddenCount = Math.max(0, localSelectedNames.length - previewNames.length);

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
              {isMultiSelection ? t('deleteBranch.titleMany') : t('deleteBranch.title')}
            </h2>
            <p id="delete-branch-description" className="mt-1 text-sm text-text3">
              {isMultiSelection
                ? t('deleteBranch.descriptionMany', { count: localSelectedNames.length })
                : t('deleteBranch.description', { type, name: branch?.name ?? '' })}
            </p>
          </div>

          {isMultiSelection && (
            <div className="rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="mb-2 text-xs font-semibold uppercase text-text3">
                {t('deleteBranch.selectedBranches', { count: localSelectedNames.length })}
              </div>
              <div className="space-y-1">
                {previewNames.map((name) => (
                  <div key={name} className="truncate text-sm text-text2">{name}</div>
                ))}
                {hiddenCount > 0 && (
                  <div className="text-xs text-text3">{t('deleteBranch.moreSelected', { count: hiddenCount })}</div>
                )}
              </div>
            </div>
          )}

          {hasCorresponding && (
            <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-text2">
                  {isMultiSelection
                    ? t('deleteBranch.alsoRemoveManyCorresponding')
                    : t('deleteBranch.alsoRemoveCorresponding', { type: correspondingType })}
                </div>
                <div className="truncate text-xs text-text3">
                  {isMultiSelection
                    ? t('deleteBranch.manyCorrespondingHint', { count: correspondingRemoteCount })
                    : correspondingBranch?.name}
                </div>
              </div>
              <ToggleSwitch
                checked={deleteCorresponding}
                onToggle={() => setDeleteCorresponding((prev) => !prev)}
                label={
                  isMultiSelection
                    ? t('deleteBranch.alsoRemoveManyCorresponding')
                    : t('deleteBranch.alsoRemoveCorresponding', { type: correspondingType })
                }
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
            {isMultiSelection
              ? t('deleteBranch.confirmManyButton', { count: localSelectedNames.length })
              : t('deleteBranch.confirmButton')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteBranchModal;
