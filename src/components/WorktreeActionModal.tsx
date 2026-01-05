import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FolderOpen, ExternalLink, Trash2 } from 'lucide-react';
import { Button, Modal } from '../ui';
import type { Worktree } from '../types';

interface WorktreeActionModalProps {
    worktree: Worktree;
    isOpen: boolean;
    onClose: () => void;
    onOpenInNewTab: () => void;
    onOpenInFinder: () => void;
    onRequestRemove: () => void;
}

const WorktreeModalContent: React.FC<WorktreeActionModalProps> = ({
    worktree,
    isOpen,
    onClose,
    onOpenInNewTab,
    onOpenInFinder,
    onRequestRemove,
}) => {
    const { t } = useTranslation('setup');
    const { t: tCommon } = useTranslation('common');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabelledBy="worktree-modal-title"
            ariaDescribedBy="worktree-modal-description"
        >
            <div className="flex flex-col gap-4 p-6">
                <div>
                    <h2 id="worktree-modal-title" className="text-xl font-semibold text-text1">
                        {worktree.branch}
                    </h2>
                    <p id="worktree-modal-description" className="text-sm text-text3 truncate" title={worktree.path}>
                        📁 {worktree.path}
                    </p>
                </div>

                <div className="space-y-2">
                    <button
                        onClick={() => { onOpenInNewTab(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border1 bg-surface2 hover:bg-surface3 transition-colors text-left"
                    >
                        <ExternalLink size={18} className="text-info shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text1">{t('worktreeAction.openInNewTab')}</div>
                            <div className="text-xs text-text3">{t('worktreeAction.openInNewTabDesc')}</div>
                        </div>
                    </button>

                    <button
                        onClick={() => { onOpenInFinder(); onClose(); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border1 bg-surface2 hover:bg-surface3 transition-colors text-left"
                    >
                        <FolderOpen size={18} className="text-warning shrink-0" />
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text1">{t('worktreeAction.openInFinder')}</div>
                            <div className="text-xs text-text3">{t('worktreeAction.openInFinderDesc')}</div>
                        </div>
                    </button>

                    {!worktree.is_main && (
                        <button
                            onClick={() => {
                                onRequestRemove();
                                onClose();
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-900/30 bg-red-900/10 hover:bg-red-900/20 transition-colors text-left"
                        >
                            <Trash2 size={18} className="text-red-400 shrink-0" />
                            <div className="min-w-0">
                                <div className="text-sm font-medium text-red-400">{t('worktreeAction.removeWorktree')}</div>
                                <div className="text-xs text-text3">{t('worktreeAction.removeWorktreeDesc')}</div>
                            </div>
                        </button>
                    )}
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

export const WorktreeActionModal: React.FC<WorktreeActionModalProps> = (props) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <WorktreeModalContent {...props} />,
        document.body,
    );
};
