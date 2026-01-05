import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, FolderOpen, Trash2 } from 'lucide-react';
import { Button, Modal } from '../ui';

interface BranchInUseModalProps {
    isOpen: boolean;
    branchName: string;
    worktreePath: string;
    onClose: () => void;
    onOpenWorktree: () => void;
    onRemoveWorktree: () => void;
}

const BranchInUseModalContent: React.FC<BranchInUseModalProps> = ({
    isOpen,
    branchName,
    worktreePath,
    onClose,
    onOpenWorktree,
    onRemoveWorktree,
}) => {
    const { t } = useTranslation('setup');
    const { t: tCommon } = useTranslation('common');

    const handleRemove = () => {
        if (confirm(t('branchInUse.confirmRemove'))) {
            onRemoveWorktree();
        }
    };

    // Get just the folder name for display
    const folderName = worktreePath.split('/').pop() || worktreePath;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="branch-in-use-title"
            ariaDescribedBy="branch-in-use-description"
        >
            <div className="flex flex-col gap-4 p-6">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-warning/10 p-2">
                        <AlertTriangle size={24} className="text-warning" />
                    </div>
                    <div>
                        <h2 id="branch-in-use-title" className="text-xl font-semibold text-text1">
                            {t('branchInUse.title', { branch: branchName })}
                        </h2>
                        <p id="branch-in-use-description" className="text-sm text-text3 mt-1">
                            {t('branchInUse.description')}
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-border1 bg-surface2 px-4 py-3">
                    <div className="text-xs text-text3 uppercase mb-1">{t('branchInUse.worktreeLabel')}</div>
                    <div className="text-sm text-text1 font-medium">{folderName}</div>
                    <div className="text-xs text-text3 truncate" title={worktreePath}>
                        {worktreePath}
                    </div>
                </div>

                <div className="text-sm text-text2">
                    {t('branchInUse.toUseBranchHere')}
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => { onOpenWorktree(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border1 bg-surface2 hover:bg-surface3 transition-colors text-left"
                    >
                        <FolderOpen size={18} className="text-primary shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text1">{t('branchInUse.openWorktree')}</div>
                            <div className="text-xs text-text3">{t('branchInUse.openWorktreeDesc')}</div>
                        </div>
                    </button>

                    <button
                        onClick={handleRemove}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 transition-colors text-left"
                    >
                        <Trash2 size={18} className="text-red-400 shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-red-400">{t('branchInUse.removeWorktree')}</div>
                            <div className="text-xs text-text3">{t('branchInUse.removeWorktreeDesc')}</div>
                        </div>
                    </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-border1">
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        {tCommon('actions.cancel')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export const BranchInUseModal: React.FC<BranchInUseModalProps> = (props) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <BranchInUseModalContent {...props} />,
        document.body
    );
};

// Helper to parse Git error and extract worktree path
export const parseBranchInUseError = (error: string): { branchName: string; worktreePath: string } | null => {
    // Pattern: "fatal: 'branch-name' is already used by worktree at '/path/to/worktree'"
    const match = error.match(/fatal: '([^']+)' is already used by worktree at '([^']+)'/);
    if (match) {
        return {
            branchName: match[1],
            worktreePath: match[2],
        };
    }
    return null;
};
