import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, ToggleSwitch } from '@/ui';
import type { CommitInfo } from '@/types';
import { useTabGit } from '@/hooks/useTabGit';

interface NewBranchFromCommitModalProps {
    isOpen: boolean;
    onClose: () => void;
    commit: CommitInfo;
}

export const NewBranchFromCommitModal: React.FC<NewBranchFromCommitModalProps> = ({
    isOpen,
    onClose,
    commit,
}) => {
    const { t } = useTranslation('commits');
    const [name, setName] = React.useState('');
    const [pushToRemote, setPushToRemote] = React.useState(false);
    const [nameError, setNameError] = React.useState<string | null>(null);
    const [formError, setFormError] = React.useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const { createBranch, refreshAll } = useTabGit();

    const shortHash = commit.hash.substring(0, 7);

    // Get subject (first line of commit message)
    const getSubject = (message: string) => {
        const normalized = message.replace(/\r\n/g, '\n');
        const firstLine = normalized.split('\n')[0] ?? '';
        return firstLine.trimEnd() || message;
    };

    const subject = getSubject(commit.message);
    const truncatedSubject = subject.length > 50 ? `${subject.substring(0, 50)}...` : subject;

    React.useEffect(() => {
        if (!isOpen) return;
        setName('');
        setPushToRemote(false);
        setNameError(null);
        setFormError(null);
        setIsSubmitting(false);
    }, [isOpen]);

    const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const nextValue = event.target.value.replace(/\s+/g, '-');
        setName(nextValue);
        if (nameError) setNameError(null);
        if (formError) setFormError(null);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const trimmedName = name.trim().replace(/\s+/g, '-');

        if (!trimmedName) {
            setNameError(t('newBranchFromCommit.nameRequired'));
            return;
        }

        setNameError(null);
        setFormError(null);
        setIsSubmitting(true);

        try {
            // checkout: false - don't switch to the new branch (avoids local changes conflict)
            await createBranch(trimmedName, commit.hash, pushToRemote, false);
            await refreshAll();
            onClose();
        } catch (submitError) {
            console.error('[Action] New Branch from Commit failed', { error: submitError });
            const message = submitError instanceof Error ? submitError.message : String(submitError);
            setFormError(message || t('newBranchFromCommit.createFailed'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel={t('newBranchFromCommit.title')}
        >
            <form className="flex flex-col gap-6 p-6" onSubmit={handleSubmit}>
                <div>
                    <h2 className="text-xl font-semibold text-text1">
                        {t('newBranchFromCommit.title')}
                    </h2>
                    <p className="text-sm text-text3 mt-1">
                        {t('newBranchFromCommit.createFrom')}
                    </p>
                    <div className="mt-2 p-2 bg-surface2 border border-border1 rounded-md">
                        <p className="text-sm font-mono">
                            <span className="text-highlight">{shortHash}</span>
                            <span className="text-text3"> - {truncatedSubject}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <Input
                            id="new-branch-name"
                            label={t('newBranchFromCommit.branchName')}
                            value={name}
                            onChange={handleNameChange}
                            placeholder={t('newBranchFromCommit.namePlaceholder')}
                            error={nameError ?? undefined}
                            autoFocus
                        />
                        <div className="mt-2 text-xs text-text3">{t('newBranchFromCommit.spacesConverted')}</div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-md border border-border1 bg-surface2 px-3 py-3">
                        <div className="min-w-0">
                            <div className="text-sm font-medium text-text2">{t('newBranchFromCommit.pushToRemote')}</div>
                            <div className="text-xs text-text3">{t('newBranchFromCommit.pushToRemoteDesc')}</div>
                        </div>
                        <ToggleSwitch
                            checked={pushToRemote}
                            onToggle={() => setPushToRemote((prev) => !prev)}
                            label={t('newBranchFromCommit.pushToRemote')}
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
                        {t('newBranchFromCommit.cancel')}
                    </Button>
                    <Button size="sm" variant="primary" type="submit" isLoading={isSubmitting}>
                        {t('newBranchFromCommit.createButton')}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};
