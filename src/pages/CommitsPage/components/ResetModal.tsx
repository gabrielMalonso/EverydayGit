import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CommitInfo } from '@/types';
import { Modal, RadioGroup, Button } from '@/ui';
import { useTabGit } from '@/hooks/useTabGit';

export type ResetType = 'soft' | 'mixed' | 'hard' | 'keep';

interface ResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    commit: CommitInfo;
}

export const ResetModal: React.FC<ResetModalProps> = ({
    isOpen,
    onClose,
    commit,
}) => {
    const { t } = useTranslation('commits');
    const [resetType, setResetType] = useState<ResetType>('mixed');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { status, resetBranch } = useTabGit();

    const currentBranch = status?.current_branch || 'HEAD';
    const shortHash = commit.hash.substring(0, 7);

    // Get subject (first line of commit message)
    const getSubject = (message: string) => {
        const normalized = message.replace(/\r\n/g, '\n');
        const firstLine = normalized.split('\n')[0] ?? '';
        return firstLine.trimEnd() || message;
    };

    const subject = getSubject(commit.message);
    const truncatedSubject = subject.length > 40 ? `${subject.substring(0, 40)}...` : subject;

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setResetType('mixed');
            setError(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleReset = async () => {
        setError(null);
        setIsSubmitting(true);

        try {
            await resetBranch(commit.hash, resetType);
            onClose();
        } catch (err) {
            console.error('[Action] Reset Modal failed', { error: err });
            const message = err instanceof Error ? err.message : String(err);
            setError(message || t('reset.resetFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel={t('reset.title')}
        >
            <div className="p-6">
                {/* Header */}
                <h2 className="text-lg font-semibold text-text1 mb-4">{t('reset.title')}</h2>

                {/* Commit info */}
                <div className="mb-4 p-3 bg-surface2 border border-border1">
                    <p className="text-sm text-text1 font-mono">
                        <span className="text-primary">{currentBranch}</span>
                        <span className="text-text3"> → </span>
                        <span className="text-highlight">{shortHash}</span>
                        <span className="text-text3"> "{truncatedSubject}"</span>
                    </p>
                    <p className="text-xs text-text3 mt-1">{t('reset.by', { author: commit.author })}</p>
                </div>

                {/* Description */}
                <p className="text-sm text-text2 mb-4">
                    {t('reset.description')}
                </p>

                {/* Radio Group */}
                <RadioGroup
                    value={resetType}
                    onChange={(value) => setResetType(value as ResetType)}
                    className="mb-6"
                >
                    <RadioGroup.Item
                        value="soft"
                        label={t('reset.soft')}
                        description={t('reset.softDesc')}
                    />
                    <RadioGroup.Item
                        value="mixed"
                        label={t('reset.mixed')}
                        description={t('reset.mixedDesc')}
                    />
                    <RadioGroup.Item
                        value="hard"
                        label={t('reset.hard')}
                        description={t('reset.hardDesc')}
                        warning
                    />
                    <RadioGroup.Item
                        value="keep"
                        label={t('reset.keep')}
                        description={t('reset.keepDesc')}
                    />
                </RadioGroup>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 rounded-md border border-danger/40 bg-danger/10 text-sm text-danger">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        {t('reset.cancel')}
                    </Button>
                    <Button
                        variant={resetType === 'hard' ? 'danger' : 'primary'}
                        onClick={handleReset}
                        isLoading={isSubmitting}
                    >
                        {t('reset.resetButton')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
